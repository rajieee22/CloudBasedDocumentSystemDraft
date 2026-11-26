import { useEffect, useState } from "react"

import {
  getCurrentUser,
  loginApi,
  logoutApi,
  submitLoadRevisionApi,
  submitShifterApplicationApi,
  submitLeaveOfAbsenceApi,
  type AuthenticatedUser,
} from "./lib/auth"
import { getApproverDashboardApi } from "./lib/dashboard"
import {
  getRequestsApi,
  getRequestDetailsApi,
  approveRequestApi,
  rejectRequestApi,
  returnRequestApi,
  resubmitLoadRevisionRequestApi,
  resubmitShifterApplicationRequestApi,
  resubmitLeaveOfAbsenceRequestApi,
  type ShifterApplicationDetails,
  type LeaveOfAbsenceDetails,
} from "./lib/requests"

import type {
  Page,
  Role,
  RequestItem,
  Status,
  LoadRevisionPermit,
} from "./types"
import type { RequestSubmission } from "./pages/requests/RequestForm"

import { Shell } from "./components/layout/AppShell"
import { Feedback, Info } from "./components/ui"
import { LoginPage } from "./pages/auth/LoginPage"

import {
  StudentDashboard,
  ApproverDashboard,
} from "./pages/dashboard/DashboardPages"

import {
  Detail,
  NewRequest,
  RequestForm,
  RequestsPage,
  SubmissionSuccess,
} from "./pages/requests/RequestPages"

import { ReviewPage } from "./pages/review/ReviewPage"

import { NotificationsPage, SignaturePage } from "./pages/account/AccountPages"
import { SettingsPage } from "./pages/account/SettingsPage"

function normalizeRequestStatus(status: string): Status {
  const validStatuses: Status[] = [
    "Pending",
    "Approved",
    "Rejected",
    "Returned for Revision",
    "Completed",
  ]

  if (!validStatuses.includes(status as Status)) {
    console.warn(`Unknown request status received: ${status}`)
    return "Pending"
  }

  return status as Status
}

export default function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [page, setPage] = useState<Page>("login")
  const [selectedType, setSelectedType] = useState("Load Revision Form")

  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  )

  const [requests, setRequests] = useState<RequestItem[]>([])
  const [queue, setQueue] = useState<RequestItem[]>([])
  const [submitted, setSubmitted] = useState<RequestItem | null>(null)

  const [editingReferenceNumber, setEditingReferenceNumber] =
    useState<string | null>(null)

  const [editingPermit, setEditingPermit] = useState<LoadRevisionPermit | null>(
    null,
  )

  const [editingGenericData, setEditingGenericData] =
    useState<ShifterApplicationDetails | LeaveOfAbsenceDetails | null>(null)

  const [feedback, setFeedback] = useState<{
    tone: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    if (!feedback) return

    const timer = window.setTimeout(() => setFeedback(null), 6000)

    return () => window.clearTimeout(timer)
  }, [feedback])

  // Restore an existing authenticated session when the app starts.
  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser()

        if (!active) return

        if (currentUser) {
          setUser(currentUser)
          setPage("dashboard")
        }
      } catch (error) {
        console.error("Session restoration failed:", error)
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  // Load the authenticated user's live request list.
  useEffect(() => {
    if (!user) {
      setRequests([])
      return
    }

    let active = true

    async function refreshRequests() {
      try {
        const result = await getRequestsApi()

        if (!active) return

        const liveRequests: RequestItem[] = result.map((request) => ({
          id: request.id,
          type: request.type,
          student: request.student,
          date: request.date,
          stage: request.stage,
          status: normalizeRequestStatus(request.status),
        }))

        setRequests(liveRequests)
      } catch (error) {
        console.error("Request list loading failed:", error)
      }
    }

    refreshRequests()

    const interval = window.setInterval(refreshRequests, 10000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user])

  // Load live pending approvals for approvers.
  useEffect(() => {
    if (!user || user.roles.includes("STUDENT")) {
      setQueue([])
      return
    }

    let active = true

    async function refreshQueue() {
      try {
        const result = await getApproverDashboardApi()

        if (!active) return

        const liveQueue: RequestItem[] = result.pendingRequests.map(
          (request) => ({
            id: request.referenceNumber,
            type: request.type,
            student: request.studentName,
            date: new Date(request.submittedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            stage: request.status,
            status: normalizeRequestStatus(request.status),
          }),
        )

        setQueue(liveQueue)
      } catch (error) {
        console.error("Pending approvals loading failed:", error)
      }
    }

    refreshQueue()

    const interval = window.setInterval(refreshQueue, 10000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user])

  // The UI role is only for choosing the appropriate interface.
  // Backend middleware remains responsible for actual authorization.
  const role: Role | null = user
    ? user.roles.includes("STUDENT")
      ? "student"
      : "approver"
    : null

  async function login(email: string, password: string) {
    const authenticatedUser = await loginApi(email, password)

    setUser(authenticatedUser)
    setSubmitted(null)
    setSelectedRequest(null)
    setPage("dashboard")
  }

  async function logout() {
    try {
      await logoutApi()

      setUser(null)
      setSubmitted(null)
      setSelectedRequest(null)
      setRequests([])
      setQueue([])
      setPage("login")
    } catch (error) {
      console.error("Logout failed:", error)
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to log out. Please try again.",
      })
    }
  }

  function open(request: RequestItem) {
    setSelectedRequest(request)
    setPage("detail")
  }

  function openForReview(request: RequestItem) {
    setSelectedRequest(request)
    setPage("review")
  }

  function editReturnedRevision(
    data: LoadRevisionPermit | ShifterApplicationDetails | LeaveOfAbsenceDetails,
    documentCode: string,
  ) {
    if (!selectedRequest) return

    setEditingReferenceNumber(selectedRequest.id)
    setEditingPermit(null)
    setEditingGenericData(null)

    if (documentCode === "LOAD_REVISION") {
      setEditingPermit(data as LoadRevisionPermit)
      setSelectedType("Load Revision Form")
    } else if (documentCode === "SHIFT_APPLICATION") {
      setEditingGenericData(data as ShifterApplicationDetails)
      setSelectedType("Shifter's Application Form")
    } else if (documentCode === "LEAVE_ABSENCE") {
      setEditingGenericData(data as LeaveOfAbsenceDetails)
      setSelectedType("Leave of Absence Form")
    } else {
      return
    }

    setPage("form")
  }

  async function openNotificationRequest(referenceNumber: string) {
    try {
      const details = await getRequestDetailsApi(referenceNumber)

      const request: RequestItem = {
        id: details.referenceNumber,
        type: details.documentName,
        student: details.student.fullName,
        date: details.submittedAt
          ? new Date(details.submittedAt).toLocaleDateString()
          : "Not available",
        stage: details.status,
        status: normalizeRequestStatus(details.status),
      }

      setSelectedRequest(request)
      setPage("detail")
    } catch (error) {
      console.error("Unable to open notification request:", error)

      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to open the requested document.",
      })
    }
  }

  async function submitRequest(submission: RequestSubmission) {
    if (!user) return

    if (editingReferenceNumber) {
      try {
        let result: Awaited<ReturnType<typeof resubmitLoadRevisionRequestApi>>

        let nextRequest: RequestItem

        if (submission.kind === "loadRevision") {
          result = await resubmitLoadRevisionRequestApi(
            editingReferenceNumber,
            submission.permit,
          )

          nextRequest = {
            id: result.referenceNumber,
            type: "Academic Load Revision Permit",
            student: result.student,
            date: new Date().toLocaleDateString(),
            stage: "Awaiting review",
            status: "Pending",
            permit: submission.permit,
          }
        } else if (submission.kind === "shifter") {
          const shifterResult = await resubmitShifterApplicationRequestApi(
            editingReferenceNumber,
            submission.data,
          )

          nextRequest = {
            id: shifterResult.referenceNumber,
            type: "Shifter's Application Form",
            student: shifterResult.student,
            date: new Date().toLocaleDateString(),
            stage: "Awaiting review",
            status: "Pending",
            reason: submission.data.reason,
          }
        } else {
          const leaveResult = await resubmitLeaveOfAbsenceRequestApi(
            editingReferenceNumber,
            submission.data,
          )

          nextRequest = {
            id: leaveResult.referenceNumber,
            type: "Leave of Absence Form",
            student: leaveResult.student,
            date: new Date().toLocaleDateString(),
            stage: "Awaiting review",
            status: "Pending",
            reason: submission.data.reason,
          }
        }

        setEditingReferenceNumber(null)
        setEditingPermit(null)
        setEditingGenericData(null)

        try {
          const refreshedRequests = await getRequestsApi()

          setRequests(
            refreshedRequests.map((request) => ({
              id: request.id,
              type: request.type,
              student: request.student,
              date: request.date,
              stage: request.stage,
              status: normalizeRequestStatus(request.status),
            })),
          )
        } catch (refreshError) {
          console.error(
            "Resubmission succeeded, but the request list refresh failed:",
            refreshError,
          )

          setRequests((previous) => [
            nextRequest,
            ...previous.filter((request) => request.id !== nextRequest.id),
          ])
        }

        setSelectedRequest(nextRequest)
        setSubmitted(nextRequest)
        setFeedback({
          tone: "success",
          message: "Changes submitted. The approval workflow has restarted.",
        })
      } catch (error) {
        console.error("Request resubmission failed:", error)

        setFeedback({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to resubmit your request. Please try again.",
        })
      }

      return
    }

    try {
      let nextRequest: RequestItem

      if (submission.kind === "loadRevision") {
        const permit = submission.permit
        const result = await submitLoadRevisionApi(permit)

        nextRequest = {
          id: result.referenceNumber,
          type: "Academic Load Revision Permit",
          student: result.student,
          date: new Date(result.submittedAt).toLocaleDateString(),
          stage: "Awaiting review",
          status: "Pending",
          permit,
        }
      } else if (submission.kind === "shifter") {
        const result = await submitShifterApplicationApi(submission.data)

        nextRequest = {
          id: result.referenceNumber,
          type: "Shifter's Application Form",
          student: result.student,
          date: new Date(result.submittedAt).toLocaleDateString(),
          stage: "Awaiting review",
          status: "Pending",
          reason: submission.data.reason,
        }
      } else {
        const result = await submitLeaveOfAbsenceApi(submission.data)

        nextRequest = {
          id: result.referenceNumber,
          type: "Leave of Absence Form",
          student: result.student,
          date: new Date(result.submittedAt).toLocaleDateString(),
          stage: "Awaiting review",
          status: "Pending",
          reason: submission.data.reason,
        }
      }

      // Refresh the authoritative request list from PostgreSQL.
      try {
        const result = await getRequestsApi()

        setRequests(
          result.map((request) => ({
            id: request.id,
            type: request.type,
            student: request.student,
            date: request.date,
            stage: request.stage,
            status: normalizeRequestStatus(request.status),
          })),
        )
      } catch (refreshError) {
        console.error(
          "Request was submitted, but the list refresh failed:",
          refreshError,
        )

        // Keep the successful submission visible until the next refresh.
        setRequests((previous) => [
          nextRequest,
          ...previous.filter((request) => request.id !== nextRequest.id),
        ])
      }

      setSubmitted(nextRequest)
      setFeedback({
        tone: "success",
        message:
          "Document submitted. The first designated approver has been assigned.",
      })
    } catch (error) {
      console.error("Request submission failed:", error)

      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit your request. Please try again.",
      })
    }
  }

  async function finishReview(
    status: string,
    reason?: string,
    signatureSlot?: string,
  ) {
    if (!selectedRequest) return

    try {
      let successMessage: string

      if (status === "Approved") {
        successMessage = await approveRequestApi(selectedRequest.id)
      } else if (status === "Rejected") {
        const result = await rejectRequestApi(selectedRequest.id, reason ?? "")
        successMessage = result?.message || "Request rejected successfully."
      } else if (status === "Returned for Revision") {
        const result = await returnRequestApi(selectedRequest.id, reason ?? "")
        successMessage =
          result?.message || "Request returned for revision successfully."
      } else {
        return
      }

      const updatedRequests = await getRequestsApi()

      setRequests(
        updatedRequests.map((request) => ({
          id: request.id,
          type: request.type,
          student: request.student,
          date: request.date,
          stage: request.stage,
          status: normalizeRequestStatus(request.status),
        })),
      )

      if (user && !user.roles.includes("STUDENT")) {
        const dashboard = await getApproverDashboardApi()

        setQueue(
          dashboard.pendingRequests.map((request) => ({
            id: request.referenceNumber,
            type: request.type,
            student: request.studentName,
            date: new Date(request.submittedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            stage: request.status,
            status: normalizeRequestStatus(request.status),
          })),
        )
      }

      setSelectedRequest(null)
      setPage("requests")
      setFeedback({ tone: "success", message: successMessage })
    } catch (error) {
      console.error("Review action failed:", error)

      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to process this request.",
      })
    }
  }

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-box">
          <p>Checking your session...</p>
        </div>
      </div>
    )
  }

  if (!user || !role) {
    return <LoginPage onLogin={login} />
  }

  if (submitted) {
    return (
      <>
        {feedback && (
          <Feedback
            tone={feedback.tone}
            message={feedback.message}
            close={() => setFeedback(null)}
          />
        )}
        <Shell
          user={user}
          role={role}
          page="requests"
          navigate={(nextPage) => {
            setSubmitted(null)
            setPage(nextPage)
          }}
          onLogout={logout}
          title="Request submitted"
          subtitle="Your document has entered the approval workflow."
        >
          <SubmissionSuccess
            request={submitted}
            done={() => {
              setSelectedRequest(submitted)
              setSubmitted(null)
              setPage("detail")
            }}
          />
        </Shell>
      </>
    )
  }

  let title = "Dashboard"

  let subtitle =
    role === "student"
      ? "An overview of your university document requests."
      : "Review and manage documents assigned to you."

  if (page === "new") {
    title = "New document request"
    subtitle = "Choose a form to begin your submission."
  }

  if (page === "form") {
    title = "Complete request"
    subtitle = "Provide the required document information."
  }

  if (page === "requests") {
    title = role === "student" ? "My requests" : "Pending approvals"

    subtitle =
      role === "student"
        ? "Search, filter, and track all your document requests."
        : "Documents currently awaiting your review."
  }

  if (page === "processed") {
    title = "Assigned documents"
    subtitle = "All documents returned for your account by the backend."
  }

  if (page === "detail") {
    title = "Request details"
    subtitle = "Review submitted information and approval progress."
  }

  if (page === "review") {
    title = "Document review"
    subtitle = "Verify information and record your decision."
  }

  if (page === "signature") {
    title = "My e-signature"
    subtitle = "Create and manage your signature for document approvals."
  }

  if (page === "notifications") {
    title = "Notifications"
    subtitle = "Stay informed about document activity and updates."
  }

  if (page === "settings") {
    title = "Profile"
    subtitle = "View your profile and account information."
  }

  const displayName = [user.givenName, user.middleName, user.familyName]
    .filter(Boolean)
    .join(" ")

  return (
    <>
      {feedback && (
        <Feedback
          tone={feedback.tone}
          message={feedback.message}
          close={() => setFeedback(null)}
        />
      )}
      <Shell
        user={user}
        role={role}
        page={page}
        navigate={setPage}
        onLogout={logout}
        title={title}
        subtitle={subtitle}
      >
        {page === "dashboard" &&
          (role === "student" ? (
            <StudentDashboard
              navigate={setPage}
              open={open}
              studentName={displayName}
            />
          ) : (
            <ApproverDashboard navigate={setPage} open={open} queue={queue} />
          ))}

        {page === "new" && (
          <NewRequest
            select={(type) => {
              setSelectedType(type)
              setPage("form")
            }}
          />
        )}

        {page === "form" && (
          <RequestForm
            type={selectedType}
            studentProfile={user}
            initialPermit={editingPermit ?? undefined}
            initialGenericData={editingGenericData ?? undefined}
            isResubmission={Boolean(editingReferenceNumber)}
            cancel={() => {
              if (editingReferenceNumber) {
                setPage("detail")
              } else {
                setPage("new")
              }
            }}
            submit={submitRequest}
          />
        )}

        {page === "requests" && (
          <RequestsPage
            data={role === "student" ? requests : queue}
            mode={role === "student" ? "student" : "pending"}
            role={role}
            open={open}
            onReview={role === "approver" ? openForReview : undefined}
          />
        )}

        {page === "processed" && role === "approver" && (
          <RequestsPage
            data={requests}
            mode="processed"
            role={role}
            open={open}
            onReview={openForReview}
          />
        )}

        {page === "detail" &&
          (selectedRequest ? (
            <Detail
              request={selectedRequest}
              role={role}
              back={() => setPage("requests")}
              review={() => setPage("review")}
              editRevision={editReturnedRevision}
            />
          ) : (
            <Info
              label="Request unavailable"
              value="Select a request from the request list to view its details."
            />
          ))}

        {page === "review" &&
          (selectedRequest ? (
            <ReviewPage
              request={selectedRequest}
              finish={finishReview}
              back={() => setPage("detail")}
            />
          ) : (
            <Info
              label="Request unavailable"
              value="Select a request before opening the review page."
            />
          ))}

        {page === "signature" && <SignaturePage />}

        {page === "notifications" && (
          <NotificationsPage
            role={role}
            onOpenRequest={openNotificationRequest}
          />
        )}

        {page === "settings" && (
          <SettingsPage user={user} onProfileUpdated={setUser} />
        )}
      </Shell>
    </>
  )
}
