const fs = require('fs');
const content = fs.readFileSync('services/agent.service.js', 'utf8');
if (!content.includes('registerAgentByAdminService')) {
  const newService = `
export const registerAgentByAdminService = async ({ payload }) => {
  const { agentName, phone, latitude, longitude, address = null, city = null, state = null, pincode = null } = payload;
  validateAgentPayload({ agentName, phone, latitude, longitude });
  
  let user = await User.findOne({ phone: phone.trim() });
  
  if (user?.roles?.includes('marketing_agent') || user?.roles?.includes('admin') || user?.roles?.includes('subadmin')) {
    throw new AppError('You cannot register this user as an agent because they are already an employee');
  }
  
  if (user?.roles?.length) {
    throw new AppError('This user already has roles: ' + user.roles.join(', '), 400);
  }
  
  if (user?.profiles?.agentId) {
    throw new AppError('User is already registered as an agent', 400);
  }
  
  if (!user) {
    user = await User.create({
      name: agentName.trim(),
      phone: phone.trim(),
      address,
      city,
      state,
      pincode,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      dashboard: 'agent',
      roles: ['agent'],
      isActive: true,
      kycStatus: 'none'
    });
  }
  
  const agentProfile = await AgentProfile.create({
    userId: user._id,
    level: 0,
    directDownlineCount: 0,
    totalDownlineCount: 0,
    registeredBy: 'ADMIN'
  });
  
  const role = await ROLE.findOne({ key: 'agent' }).select('permissions').lean();
  
  await User.updateOne(
    { _id: user._id },
    { $set: { dashboard: 'agent', roles: ['agent'], permissions: role?.permissions || [], 'profiles.agentId': agentProfile._id } }
  );
  
  return { userId: user._id, agentProfileId: agentProfile._id, message: 'Agent registered by admin successfully' };
};
`;
  fs.writeFileSync('services/agent.service.js', content + '\n' + newService);
}
