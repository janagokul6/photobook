import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  submissionId: string;
  selectedPhotoIds: string[];
  submittedAt: Date;
  folderId?: string;
  folderName?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
  };
}

const SubmissionSchema: Schema = new Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },
  selectedPhotoIds: {
    type: [String],
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  folderId: {
    type: String,
    index: true,
  },
  folderName: {
    type: String,
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
  },
});

// Index for faster queries
SubmissionSchema.index({ submittedAt: -1 });

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

