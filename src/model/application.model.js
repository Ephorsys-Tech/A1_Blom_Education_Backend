import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Career",
      required: [true, "Job opening reference is required"],
    },
    name: {
      type: String,
      required: [true, "Applicant name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Applicant email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Applicant phone number is required"],
      trim: true,
    },
    resumeUrl: {
      type: String,
      required: [true, "Resume is required"],
    },
    resumePublicId: {
      type: String,
      required: [true, "Resume public ID is required"],
    },
    coverLetter: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ApplicationModel = mongoose.model("Application", applicationSchema);
export default ApplicationModel;
