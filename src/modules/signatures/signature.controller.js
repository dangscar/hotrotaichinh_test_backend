import * as signatureService from './signature.service.js';
import { successResponse } from '../../shared/utils/apiResponse.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

export const sign = async (req, res) => {
  const signature = await signatureService.signDocument(
    req.params.submissionId,
    req.user,
    req.body,
  );
  return successResponse(res, signature, 'Document signed', HTTP_STATUS.CREATED);
};

export const verify = async (req, res) => {
  const result = await signatureService.verifySignature(req.params.id);
  return successResponse(res, result, 'Verification complete');
};

export const getBySubmission = async (req, res) => {
  const signatures = await signatureService.getBySubmission(req.params.submissionId);
  return successResponse(res, signatures);
};
