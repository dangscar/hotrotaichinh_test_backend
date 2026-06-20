import mongoose from 'mongoose';
import { SUBMISSION_STATUS } from '../../shared/constants/submissionStatus.js';

const formFieldSchema = new mongoose.Schema(
  {
    name: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'file', 'textarea'],
    },
    required: Boolean,
    options: [String],
    validation: mongoose.Schema.Types.Mixed,
  },
  { _id: false },
);

const formTemplateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    fields: [formFieldSchema],
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
    processingDays: { type: Number, default: 7 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

const submissionSchema = new mongoose.Schema(
  {
    submissionCode: { type: String, required: true, unique: true },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormTemplate', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      default: SUBMISSION_STATUS.DRAFT,
    },
    currentStepOrder: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    notes: { type: String },
    submittedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

submissionSchema.index({ submittedBy: 1, status: 1 });
submissionSchema.index({ status: 1, assignedTo: 1 });

export const FormTemplate = mongoose.model('FormTemplate', formTemplateSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
