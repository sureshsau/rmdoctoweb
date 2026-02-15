import RMCredit from "../models/rmcredit/rmcredit.model.js";
import RMCreditTransaction from "../models/rmcredit/rmcreditTransaction.model.js";
import AppError from "../utils/AppError.js";

export const addCreditController = async (req, res, next) => {
  try {
    const { agentId, expiryDate, description } = req.body;

    // Always convert here
    const amount = Number(req.body.amount);

    if (!agentId || !expiryDate || isNaN(amount)) {
      return next(new AppError("Invalid input data", 400));
    }

    if (amount <= 0) {
      return next(new AppError("Amount must be greater than 0", 400));
    }

    let wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      wallet = await RMCredit.create({
        agentId,
        totalCredit: amount,
        balance: amount,
        expiryDate
      });
    } else {
      wallet.totalCredit += amount;
      wallet.balance += amount;
      wallet.expiryDate = expiryDate;

      await wallet.save();
    }

    await RMCreditTransaction.create({
      walletId: wallet._id,
      agentId,
      amount,
      type: "credit",
      performedBy: req.user.id,
      description: description || "Admin added credit"
    });

    res.status(200).json({
      success: true,
      message: "Credit added successfully",
      data: wallet
    });

  } catch (error) {
    next(error);
  }
};


export const requestRevokeCreditController = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const amount = Number(req.body.amount);

    if (!agentId || isNaN(amount) || amount <= 0) {
      return next(new AppError("Valid agent and amount required", 400));
    }

    const wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      return next(new AppError("Wallet not found", 404));
    }

    if (Number(wallet.balance) < amount) {
      return next(new AppError("Insufficient balance", 400));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    wallet.revokeOtp = otp;
    wallet.revokeOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
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


export const verifyRevokeCreditController = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const otp = String(req.body.otp);

    if (!agentId || !otp) {
      return next(new AppError("Agent and OTP required", 400));
    }

    const wallet = await RMCredit.findOne({ agentId });

    if (!wallet) {
      return next(new AppError("Wallet not found", 404));
    }

    if (!wallet.revokeOtp || String(wallet.revokeOtp) !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    if (!wallet.revokeOtpExpiresAt || wallet.revokeOtpExpiresAt < new Date()) {
      return next(new AppError("OTP expired", 400));
    }

    const amount = Number(wallet.revokeAmount);

    if (isNaN(amount) || amount <= 0) {
      return next(new AppError("Invalid revoke amount", 400));
    }

    if (Number(wallet.balance) < amount) {
      return next(new AppError("Insufficient balance", 400));
    }

    wallet.balance = Number(wallet.balance) - amount;
    wallet.usedCredit = Number(wallet.usedCredit || 0) + amount;

    wallet.revokeOtp = null;
    wallet.revokeOtpExpiresAt = null;
    wallet.revokeAmount = null;

    await wallet.save();

    await RMCreditTransaction.create({
      walletId: wallet._id,
      agentId,
      amount,
      type: "revoke",
      performedBy: req.user.id,
      description: "Admin revoked credit"
    });

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


