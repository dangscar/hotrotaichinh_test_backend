import mongoose from 'mongoose';

const workflowStepSchema = new mongoose.Schema(
  {
    stepOrder: Number,
    stepName: String,
    role: String,
    action: { type: String, enum: ['review', 'approve', 'sign', 'forward'] },
    isRequired: { type: Boolean, default: true },
    allowReject: { type: Boolean, default: true },
    allowReturn: { type: Boolean, default: true },
    slaHours: Number,
  },
  { _id: false },
);

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormTemplate' },
    steps: [workflowStepSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const workflowInstanceSchema = new mongoose.Schema(
  {
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', unique: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
    currentStepOrder: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    steps: [
      {
        stepOrder: Number,
        stepName: String,
        assignedRole: String,
        handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: String,
        comment: String,
        handledAt: Date,
        signatureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signature' },
      },
    ],
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

export const Workflow = mongoose.model('Workflow', workflowSchema);
export const WorkflowInstance = mongoose.model('WorkflowInstance', workflowInstanceSchema);
