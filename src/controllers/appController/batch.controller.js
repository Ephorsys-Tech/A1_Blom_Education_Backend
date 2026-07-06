import { respond } from "../../utils/respond.js";
import {
  createBatchService,
  updateBatchService,
  deleteBatchService,
  getBatchesService,
  getAdminBatchesService,
  getBatchByIdService,
} from "../../services/batch.service.js";

// ==========================================
// CREATE BATCH (Admin Only)
// ==========================================
export const createBatch = async (req, res, next) => {
  try {
    const batch = await createBatchService(req.body, req.file);
    return respond(res, 201, "Batch created successfully.", batch);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE BATCH (Admin Only)
// ==========================================
export const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await updateBatchService(id, req.body, req.file);
    return respond(res, 200, "Batch updated successfully.", batch);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE BATCH (Admin Only)
// ==========================================
export const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteBatchService(id);
    return respond(res, 200, "Batch deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ACTIVE BATCHES (Public / Students)
// ==========================================
export const getBatches = async (req, res, next) => {
  try {
    const batches = await getBatchesService();
    return respond(res, 200, "Batches fetched successfully.", batches);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL BATCHES (Admin Only)
// ==========================================
export const getAdminBatches = async (req, res, next) => {
  try {
    const batches = await getAdminBatchesService();
    return respond(res, 200, "All batches fetched successfully.", batches);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET BATCH BY ID (Public / Students)
// ==========================================
export const getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await getBatchByIdService(id);
    return respond(res, 200, "Batch fetched successfully.", batch);
  } catch (error) {
    next(error);
  }
};
