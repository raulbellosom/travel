/**
 * resourcesService.js
 *
 * Canonical resource CRUD service.
 * All new code should import from this module.
 * `propertiesService` remains as a deprecated compatibility alias
 * inside propertiesService.js.
 */
import { propertiesService } from "./propertiesService";

const toResourceId = (value = "") => String(value || "").trim();

export const resourcesService = {
  async checkSlugAvailability(slug, options = {}) {
    return propertiesService.checkSlugAvailability(slug, options);
  },

  async listPublic(options = {}) {
    return propertiesService.listPublic(options);
  },

  async getPublicBySlug(slug) {
    return propertiesService.getPublicBySlug(slug);
  },

  async listPublicByIds(resourceIds) {
    return propertiesService.listPublicByIds(resourceIds);
  },

  async getById(resourceId) {
    return propertiesService.getById(toResourceId(resourceId));
  },

  async listMine(userId, options = {}) {
    return propertiesService.listMine(userId, options);
  },

  async listByResponsible(userId) {
    return propertiesService.listByResponsible(userId);
  },

  async updateResponsibleAgent(resourceId, ownerUserId) {
    return propertiesService.updateResponsibleAgent(resourceId, ownerUserId);
  },

  async create(userId, payload) {
    return propertiesService.create(userId, payload);
  },

  async update(resourceId, userId, payload) {
    return propertiesService.update(resourceId, userId, payload);
  },

  async softDelete(resourceId) {
    return propertiesService.softDelete(resourceId);
  },

  async listImages(resourceId) {
    return propertiesService.listImages(resourceId);
  },

  async uploadResourceImages(resourceId, files, options = {}) {
    return propertiesService.uploadPropertyImages(resourceId, files, options);
  },

  async getOwnerProfile(ownerId) {
    return propertiesService.getOwnerProfile(ownerId);
  },
};
