import queueService from "../factory/queueFactory.js";

export const sendOtpEmail = (email, otp) => {
  return queueService.publish(
    "emailQueue",
    { email, otp },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 30000 },
      removeOnComplete: true,
    },
    "send-otp"
  );
};
