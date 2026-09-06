import mongoose from "mongoose";
import crypto from "crypto";
import RMCredit from "../models/rmcredit/rmcredit.model.js";
import RMCreditTransaction from "../models/rmcredit/rmcreditTransaction.model.js";
import AppError from "../utils/AppError.js";
import razorpay from "../config/razorpay.config.js";

export const addCreditController = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { agentId, expiryDate, description } = req.body;

    // Always convert here
    const amount = Number(req.body.amount);

    if (!agentId || !expiryDate || isNaN(amount)) {
      throw new AppError("Invalid input data", 400);
    }

    if (amount <= 0) {
      throw new AppError("Amount must be greater than 0", 400);
    }

    // findOneAndUpdate + $inc so a concurrent add can't clobber another
    // one's write the way a find -> mutate -> save round trip could.
    const wallet = await RMCredit.findOneAndUpdate(
      { agentId },
      {
        $inc: { totalCredit: amount, balance: amount },
        $set: { expiryDate },
      },
      { new: true, upsert: true, session, setDefaultsOnInsert: true }
    );

    await RMCreditTransaction.create(
      [
        {
          walletId: wallet._id,
          agentId,
          amount,
          type: "credit",
          performedBy: req.user.id,
          description: description || "Admin added credit",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Credit added successfully",
      data: wallet
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


export const requestRevokeCreditController = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const amount = Number(req.body.amount);

    if (!agentId || isNaN(amount) || amount <= 0) {
      return next(new AppError("Valid RM Member and amount required", 400));
    }

    const wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      return next(new AppError("Wallet not found", 404));
    }

    if (Number(wallet.balance) < amount) {
      return next(new AppError("Insufficient balance", 400));
    }

    // A fresh OTP can't be requested more than once every 60s -- otherwise
    // an admin (or anyone who guessed the endpoint) could keep regenerating
    // OTPs to try to outrun the attempt lockout below.
    if (wallet.revokeOtpSentAt && Date.now() - wallet.revokeOtpSentAt.getTime() < 60_000) {
      const wait = Math.ceil((60_000 - (Date.now() - wallet.revokeOtpSentAt.getTime())) / 1000);
      return next(new AppError(`Please wait ${wait}s before requesting another OTP`, 429));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    wallet.revokeOtp = otp;
    wallet.revokeOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    wallet.revokeOtpSentAt = new Date();
    wallet.revokeOtpAttempts = 0;
    wallet.revokeAmount = amount; // already number

    await wallet.save();

    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    next(error);
  }
};


const MAX_REVOKE_OTP_ATTEMPTS = 5;

export const verifyRevokeCreditController = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const otp = String(req.body.otp);

    if (!agentId || !otp) {
      return next(new AppError("RM Member and OTP required", 400));
    }

    // OTP bookkeeping (expiry / wrong-guess counter / lockout) is deliberately
    // NOT inside the transaction below -- a wrong-attempt still has to persist
    // even though the request as a whole fails, and a transaction rollback
    // would otherwise erase that increment along with it.
    const wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      return next(new AppError("Wallet not found", 404));
    }

    if (!wallet.revokeOtpExpiresAt || wallet.revokeOtpExpiresAt < new Date()) {
      return next(new AppError("OTP expired", 400));
    }

    if (wallet.revokeOtpAttempts >= MAX_REVOKE_OTP_ATTEMPTS) {
      wallet.revokeOtp = null;
      wallet.revokeOtpExpiresAt = null;
      wallet.revokeAmount = null;
      await wallet.save();
      return next(new AppError("Too many incorrect attempts. Request a new OTP.", 429));
    }

    if (!wallet.revokeOtp || String(wallet.revokeOtp) !== otp) {
      wallet.revokeOtpAttempts += 1;
      await wallet.save();
      return next(
        new AppError(
          `Invalid OTP (${MAX_REVOKE_OTP_ATTEMPTS - wallet.revokeOtpAttempts} attempt(s) left)`,
          400
        )
      );
    }

    const amount = Number(wallet.revokeAmount);

    if (isNaN(amount) || amount <= 0) {
      return next(new AppError("Invalid revoke amount", 400));
    }

    // OTP confirmed correct -- the actual balance mutation + ledger write do
    // need all-or-nothing atomicity, so that part runs in its own session.
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const lockedWallet = await RMCredit.findOne({ agentId }).session(session);

      if (Number(lockedWallet.balance) < amount) {
        throw new AppError("Insufficient balance", 400);
      }

      lockedWallet.balance = Number(lockedWallet.balance) - amount;
      lockedWallet.usedCredit = Number(lockedWallet.usedCredit || 0) + amount;

      lockedWallet.revokeOtp = null;
      lockedWallet.revokeOtpExpiresAt = null;
      lockedWallet.revokeOtpSentAt = null;
      lockedWallet.revokeOtpAttempts = 0;
      lockedWallet.revokeAmount = null;

      await lockedWallet.save({ session });

      await RMCreditTransaction.create(
        [
          {
            walletId: lockedWallet._id,
            agentId,
            amount,
            type: "revoke",
            performedBy: req.user.id,
            description: "Admin revoked credit",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    res.status(200).json({
      success: true,
      message: "Credit revoked successfully"
    });

  } catch (error) {
    next(error);
  }
};

export const getMyCreditDetailsController = async (req, res, next) => {
  try {
    const agentId = req.user.id;

    const wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      return res.status(200).json({
        success: true,
        data: {
          wallet: {
            balance: 0,
            totalCredit: 0,
            usedCredit: 0,
            expiryDate: null,
            status: "inactive",
            revokeOtp: null,
            revokeOtpExpiresAt: null,
            revokeAmount: null
          },
          transactions: []
        }
      });
    }

    const transactions = await RMCreditTransaction.find({ agentId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          totalCredit: wallet.totalCredit,
          usedCredit: wallet.usedCredit,
          expiryDate: wallet.expiryDate,
          status: wallet.status,
          revokeOtp: wallet.revokeOtp,
          revokeOtpExpiresAt: wallet.revokeOtpExpiresAt,
          revokeAmount: wallet.revokeAmount
        },
        transactions
      }
    });

  } catch (error) {
    next(error);
  }
};


export const getAgentCreditDetailsController = async (req, res, next) => {
  try {
    const { agentId } = req.params;

    const wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      return next(new AppError("Wallet not found", 404));
    }

    const transactions = await RMCreditTransaction.find({ agentId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          totalCredit: wallet.totalCredit,
          usedCredit: wallet.usedCredit,
          expiryDate: wallet.expiryDate,
          status: wallet.status,
          revokeOtp: wallet.revokeOtp,
          revokeOtpExpiresAt: wallet.revokeOtpExpiresAt
        },
        transactions
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getAdminCreditHistoryController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = null, agentId = null } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }
    if (agentId) {
      query.agentId = agentId;
    }

    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 20;

    const [transactions, totalRecords] = await Promise.all([
      RMCreditTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .populate("agentId", "name phone")
        .populate("performedBy", "name")
        .populate("walletId", "expiryDate balance")
        .lean(),
      RMCreditTransaction.countDocuments(query)
    ]);

    const data = transactions.map(txn => ({
      transactionId: txn._id,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      date: txn.createdAt,

      agent: txn.agentId ? {
        id: txn.agentId._id,
        name: txn.agentId.name,
        phone: txn.agentId.phone
      } : null,

      performedBy: txn.performedBy ? {
        name: txn.performedBy.name,
      } : null,

      wallet: txn.walletId ? {
        currentBalance: txn.walletId.balance,
        expiryDate: txn.walletId.expiryDate
      } : null
    }));

    res.status(200).json({
      success: true,
      data: {
        history: data,
        pagination: {
          totalRecords,
          currentPage,
          totalPages: Math.ceil(totalRecords / perPage),
          limit: perPage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ════════════════════════════════════════════════
   REPAYMENT -- an agent pays back credit they've used.
   The line is time-limited: whatever was drawn down (usedCredit) has to come
   back to the admin, either by the agent paying online themselves, or by
   handing over cash which the admin then records.
════════════════════════════════════════════════ */

/** Agent opens a Razorpay order to pay back some (or all) of their usedCredit. */
export const createRepaymentOrderController = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const amount = Number(req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      return next(new AppError("Valid amount required", 400));
    }

    const wallet = await RMCredit.findOne({ agentId });
    if (!wallet) {
      return next(new AppError("Wallet not found", 404));
    }
    if (amount > Number(wallet.usedCredit)) {
      return next(new AppError("Amount exceeds the credit you currently owe", 400));
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rmcredit_repay_${wallet._id}_${Date.now()}`,
      notes: { agentId: agentId.toString(), purpose: "rmcredit_repayment" }
    });

    // The amount is locked here, server-side -- verify below reads this
    // rather than trusting whatever the client claims it paid.
    wallet.pendingRepayment = { amount, razorpayOrderId: razorpayOrder.id };
    await wallet.save();

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    next(error);
  }
};

/** Verifies the Razorpay signature and applies the repayment atomically. */
export const verifyRepaymentController = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const agentId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError("Incomplete payment confirmation", 400);
    }

    const wallet = await RMCredit.findOne({ agentId }).session(session);
    if (!wallet) throw new AppError("Wallet not found", 404);

    if (wallet.pendingRepayment?.razorpayOrderId !== razorpay_order_id) {
      throw new AppError("No matching pending repayment for this order", 400);
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    if (expected !== razorpay_signature) {
      throw new AppError("Payment verification failed", 400);
    }

    // Clamp defensively -- usedCredit may have moved (e.g. a fresh spend)
    // since the order was created.
    const amount = Math.min(Number(wallet.pendingRepayment.amount), Number(wallet.usedCredit));

    wallet.usedCredit = parseFloat((Number(wallet.usedCredit) - amount).toFixed(2));
    wallet.balance = parseFloat((Number(wallet.balance) + amount).toFixed(2));
    wallet.pendingRepayment = { amount: null, razorpayOrderId: null };
    await wallet.save({ session });

    await RMCreditTransaction.create(
      [
        {
          walletId: wallet._id,
          agentId,
          amount,
          type: "repayment",
          performedBy: agentId,
          razorpay: { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
          description: "Online repayment via Razorpay"
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Repayment successful",
      data: wallet
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Admin-recorded offline repayment -- the agent handed over cash in person,
 * so there's nothing to verify against a gateway; the admin's entry IS the
 * record. No OTP round trip needed (unlike revoke): the agent is the one
 * initiating the handover, the admin is just confirming receipt.
 */
export const recordOfflineRepaymentController = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { agentId, description } = req.body;
    const amount = Number(req.body.amount);

    if (!agentId || isNaN(amount) || amount <= 0) {
      throw new AppError("Valid RM Member and amount required", 400);
    }

    const wallet = await RMCredit.findOne({ agentId }).session(session);
    if (!wallet) throw new AppError("Wallet not found", 404);

    if (amount > Number(wallet.usedCredit)) {
      throw new AppError("Amount exceeds the credit this agent currently owes", 400);
    }

    wallet.usedCredit = parseFloat((Number(wallet.usedCredit) - amount).toFixed(2));
    wallet.balance = parseFloat((Number(wallet.balance) + amount).toFixed(2));
    await wallet.save({ session });

    await RMCreditTransaction.create(
      [
        {
          walletId: wallet._id,
          agentId,
          amount,
          type: "repayment",
          performedBy: req.user.id,
          description: description || "Offline (cash) repayment recorded by admin"
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Offline repayment recorded",
      data: wallet
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


