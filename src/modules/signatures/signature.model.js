import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema(
  {
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    signatureType: { type: String, enum: ['digital', 'electronic'], default: 'digital' },
    certificateInfo: {
      subject: String,
      issuer: String,
      serialNumber: String,
      validFrom: Date,
      validTo: Date,
    },
    signatureHash: String,
    signatureData: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'valid', 'invalid', 'expired'],
      default: 'pending',
    },
    verifiedAt: Date,
    signedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

signatureSchema.index({ submissionId: 1 });
signatureSchema.index({ signedBy: 1 });

const Signature = mongoose.model('Signature', signatureSchema);
export default Signature;
