export { default as api } from "./axios"

export {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "./token"

export { handleApiError } from "./error-handler"
export type { ApiError } from "./error-handler"

export {
  login,
  register,
  refreshToken,
  logout,
  getMe,
  updateMe,
  requestPasswordReset,
  confirmPasswordReset,
} from "./auth"
export type { LoginData, SignupData, AuthResponse, UserData } from "./auth"

export {
  getFeed,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  getMyReports,
  getNearbyReports,
  upvoteReport,
  removeUpvote,
  getUpvotes,
  updateReportStatus,
  addProgressNote,
  getPendingModeration,
  moderateReport,
} from "./reports"
export type { ReportFilters, NearbyParams, FeedReport, FeedResponse, FeedImage, FeedVideo } from "./reports"

export {
  getComments,
  createComment,
  getComment,
  updateComment,
  deleteComment,
} from "./comments"

export {
  getNotices,
  createNotice,
  getNotice,
  updateNotice,
  deleteNotice,
} from "./notices"
export type { NoticeFilters } from "./notices"

export {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "./notifications"

export {
  getSummary,
  getAnalytics,
  getRecentReports,
} from "./dashboard"
export type { DashboardFilters } from "./dashboard"

export { getMarkers } from "./map"
export type { MapMarkerFilters } from "./map"

export { getPublicProfile, updateProfile } from "./users"
