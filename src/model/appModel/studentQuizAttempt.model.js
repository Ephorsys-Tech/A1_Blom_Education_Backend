import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    selectedOption: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    correctOption: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },

    isCorrect: {
      type: Boolean,
      required: true,
    },

    marks: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const studentQuizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },

    answers: [answerSchema],

    totalQuestions: {
      type: Number,
      required: true,
    },

    totalMarks: {
      type: Number,
      required: true,
    },

    obtainedMarks: {
      type: Number,
      required: true,
    },

    percentage: {
      type: Number,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "StudentQuizAttempt",
  studentQuizAttemptSchema
);