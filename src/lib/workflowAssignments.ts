import { useEffect, useState } from "react"

import {
  getRequestDetailsApi,
  getRequestsApi,
  type WorkflowStep,
} from "./requests"

export type AssignmentKey = "professor" | "adviser" | "chairperson" | "dean" | "registrar"

export interface RoleAssignment {
  key: AssignmentKey
  label: string
  name: string | null
  status: string | null
}

export interface WorkflowAssignments {
  referenceNumber: string
  roles: RoleAssignment[]
}

export interface WorkflowAssignmentsState {
  loading: boolean
  error: string | null
  assignments: WorkflowAssignments | null
}

const ROLE_DEFINITIONS: Array<{
  key: AssignmentKey
  label: string
  pattern: RegExp
}> = [
  {
    key: "professor",
    label: "Professor",
    pattern: /PROFESSOR/i,
  },
  {
    key: "adviser",
    label: "Academic adviser",
    pattern: /ADVISER/i,
  },
  {
    key: "chairperson",
    label: "Department chairperson",
    pattern: /CHAIRPERSON/i,
  },
  { key: "dean", label: "College dean", pattern: /DEAN/i },
  { key: "registrar", label: "University registrar", pattern: /REGISTRAR/i },
]

function findStep(step: WorkflowStep, key: AssignmentKey) {
  const definition = ROLE_DEFINITIONS.find((item) => item.key === key)

  if (!definition) return false

  return (
    definition.pattern.test(step.roleName) ||
    definition.pattern.test(step.stepName)
  )
}

function toAssignments(
  referenceNumber: string,
  steps: WorkflowStep[],
): WorkflowAssignments {
  const roles = ROLE_DEFINITIONS.map((definition) => {
    const step = steps.find((candidate) => findStep(candidate, definition.key))
    const approver =
      step?.approvers.find((item) => item.name?.trim()) ?? step?.approvers[0]

    return {
      key: definition.key,
      label: definition.label,
      name: approver?.name?.trim() || null,
      status: approver?.status ?? null,
    }
  })

  return { referenceNumber, roles }
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load backend approval assignments."
}

export function useLatestWorkflowAssignments(): WorkflowAssignmentsState {
  const [state, setState] = useState<WorkflowAssignmentsState>({
    loading: true,
    error: null,
    assignments: null,
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const requests = await getRequestsApi()
        let assignments: WorkflowAssignments | null = null
        let detailError: string | null = null

        for (const request of requests.slice(0, 5)) {
          try {
            const details = await getRequestDetailsApi(request.id)
            const steps = details.workflowProgress?.workflowSteps ?? []

            if (steps.length > 0) {
              assignments = toAssignments(request.id, steps)
              break
            }
          } catch (error) {
            detailError = errorMessage(error)
          }
        }

        if (!active) return

        setState({
          loading: false,
          error: assignments ? null : detailError,
          assignments,
        })
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error: errorMessage(error),
            assignments: null,
          })
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return state
}
