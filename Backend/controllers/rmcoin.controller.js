import mongoose from "mongoose";
import User from "../models/user.model.js";
import RMCoinsTransaction from "../models/rmcoinTransfer.model.js";
import AppError from "../utils/AppError.js";

export const userTransferToAdminController = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user.id;
    const amount = Number(req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      throw new AppError("Valid amount required", 400);
    }

    const sender = await User.findById(senderId).session(session);

    if (!sender) {
      throw new AppError("User not found", 404);
    }

    if (Number(sender.rmCoinsBalance || 0) < amount) {
      throw new AppError("Insufficient balance", 400);
    }

    const admin = await User.findOne({
      roles: { $in: ["admin"] },
      isActive: true,
      isBlocked: false
    }).session(session);

    if (!admin) {
      throw new AppError("Admin not found", 404);
    }

    sender.rmCoinsBalance -= amount;
    admin.rmCoinsBalance =
      Number(admin.rmCoinsBalance || 0) + amount;

    await sender.save({ session });
    await admin.save({ session });

    await RMCoinsTransaction.create(
      [
        {
          fromUserId: sender._id,
          toUserId: admin._id,
          amount,
          type: "transfer",
          description: "User transferred coins to admin"
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Transfer successful",
      transferredTo: {
        adminId: admin._id,
        adminName: admin.name
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


export const adminTransferToUserController = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adminId = req.user.id;
    const { receiverId } = req.body;
    const amount = Number(req.body.amount);
    console.log("Admin Transfer Request:", { adminId, receiverId, amount });

    if (!receiverId || isNaN(amount) || amount <= 0) {
      throw new AppError("Valid receiver and amount required", 400);
    }

    const admin = await User.findById(adminId).session(session);

    if (!admin || !admin.roles.includes("admin")) {
      throw new AppError("Only admin can transfer coins", 403);
    }

    const receiver = await User.findById(receiverId).session(session);

    if (!receiver) {
      throw new AppError("Receiver not found", 404);
    }

    if (Number(admin.rmCoinsBalance || 0) < amount) {
      throw new AppError("Admin has insufficient balance", 400);
    }

    admin.rmCoinsBalance -= amount;
    receiver.rmCoinsBalance =
      Number(receiver.rmCoinsBalance || 0) + amount;

    await admin.save({ session });
    await receiver.save({ session });

    await RMCoinsTransaction.create(
      [
        {
          fromUserId: admin._id,
          toUserId: receiver._id,
          amount,
          type: "admin_transfer",
          description: "Admin transferred coins to user"
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Admin transfer successful",
      transferredTo: {
        userId: receiver._id,
        userName: receiver.name
      }
    });

  } catch (error) {
    console.log(error)
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


export const adminRechargeController = async (req, res, next) => {
  try {
    const adminId = req.user.id; // ✅ get from token
    const amount = Number(req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      return next(new AppError("Valid amount required", 400));
    }

    const admin = await User.findById(adminId);

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    if (!admin.roles.includes("admin")) {
      return next(new AppError("Only admin can recharge wallet", 403));
    }

    // Safe increment
    admin.rmCoinsBalance =
      Number(admin.rmCoinsBalance || 0) + amount;

    await admin.save();

    await RMCoinsTransaction.create({
      fromUserId: null,              // since external recharge
      toUserId: admin._id,
      amount,
      type: "admin_recharge",
      description: "Admin recharged own wallet"
    });

    res.status(200).json({
      success: true,
      message: "Wallet recharged successfully",
      newBalance: admin.rmCoinsBalance
    });

  } catch (error) {
    next(error);
  }
};





export const getUserRMCoinsLogsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (isNaN(currentPage) || isNaN(perPage)) {
      return next(new AppError("Invalid pagination values", 400));
    }

    const skip = (currentPage - 1) * perPage;
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "name email rmCoinsBalance"
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const filter = {
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    };

    const totalRecords = await RMCoinsTransaction.countDocuments(filter);

    const logs = await RMCoinsTransaction.find(filter)
      .populate("fromUserId", "name")
      .populate("toUserId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    const sent = await RMCoinsTransaction.aggregate([
      { $match: { fromUserId: user._id } },
      { $group: { _id: null, totalSent: { $sum: "$amount" } } }
    ]);

    const received = await RMCoinsTransaction.aggregate([
      { $match: { toUserId: user._id } },
      { $group: { _id: null, totalReceived: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      success: true,
      wallet: {
        userId: user._id,
        name: user.name,
        balance: user.rmCoinsBalance,
        totalSent: sent[0]?.totalSent || 0,
        totalReceived: received[0]?.totalReceived || 0
      },
      pagination: {
        page: currentPage,
        totalPages: Math.ceil(totalRecords / perPage),
        totalRecords
      },
      logs
    });

  } catch (error) {
    next(error);
  }
};

export const getAdminRMCoinsLogsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;

    const currentPage = Number(page);
    const perPage = Number(limit);

    if (isNaN(currentPage) || isNaN(perPage)) {
      return next(new AppError("Invalid pagination values", 400));
    }

    if (!req.user.roles.includes("admin")) {
      return next(new AppError("Only admin allowed", 403));
    }

    const targetUserId = userId || req.user.id;

    const user = await User.findById(targetUserId).select(
      "name email rmCoinsBalance"
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const skip = (currentPage - 1) * perPage;

    const filter = {
      $or: [
        { fromUserId: targetUserId },
        { toUserId: targetUserId }
      ]
    };

    const totalRecords = await RMCoinsTransaction.countDocuments(filter);

    const logs = await RMCoinsTransaction.find(filter)
      .populate("fromUserId", "name")
      .populate("toUserId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);

    // ✅ Only admin → user transfers
    const sent = await RMCoinsTransaction.aggregate([
      {
        $match: {
          fromUserId: user._id,
          type: "admin_transfer"
        }
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$amount" }
        }
      }
    ]);

    // ✅ Only user → admin transfers
    const received = await RMCoinsTransaction.aggregate([
      {
        $match: {
          toUserId: user._id,
          type: "transfer"
        }
      },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: "$amount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      wallet: {
        userId: user._id,
        name: user.name,
        balance: user.rmCoinsBalance,
        totalSent: sent[0]?.totalSent || 0,
        totalReceived: received[0]?.totalReceived || 0
      },
      pagination: {
        page: currentPage,
        totalPages: Math.ceil(totalRecords / perPage),
        totalRecords
      },
      logs
    });

  } catch (error) {
    next(error);
  }
};



