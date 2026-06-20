import Signature from './signature.model.js';
import { verifyWithCA } from './integrations/signatureVerifier.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

export const signDocument = async (submissionId, user, signatureData) => {
  return Signature.create({
    submissionId,
    signedBy: user.id,
    signatureData: signatureData.data,
    signatureHash: signatureData.hash,
    certificateInfo: signatureData.certificateInfo,
    verificationStatus: 'valid',
    signedAt: new Date(),
  });
};

export const verifySignature = async (signatureId) => {
  const signature = await Signature.findById(signatureId);
  if (!signature) throw new NotFoundError('Signature not found');

  const isValid = await verifyWithCA(signature);
  signature.verificationStatus = isValid ? 'valid' : 'invalid';
  signature.verifiedAt = new Date();
  await signature.save();

  return { isValid, signature };
};

export const getBySubmission = (submissionId) =>
  Signature.find({ submissionId }).populate('signedBy', 'fullName role');
