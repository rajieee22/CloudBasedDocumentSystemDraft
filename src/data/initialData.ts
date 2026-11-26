import type { LoadRevisionPermit, RequestItem } from "../types"

export const defaultPermit: LoadRevisionPermit = {
  term: "2nd Semester",
  schoolYear: "2024–2025",
  familyName: "Santos",
  givenName: "Andrea",
  middleName: "M.",
  studentId: "2021-1234",
  permitDate: "2025-05-26",
  college: "College of Computer Studies",
  department: "Information Technology Department",
  courseYear: "BS Information Technology – 4th Year",
  professor: "",
  professorUserId: null,
  collegeDean: "",
  departmentChairperson: "",
  withdraw: [
    {
      course: "IT 138 – A",
      title: "Information Assurance and Security",
      units: "3",
    },
  ],
  add: [
    {
      course: "IT 141 – B",
      title: "Systems Integration and Architecture",
      units: "3",
      closed: false,
    },
  ],
  loadBeforeUnits: "18",
  loadBeforeHours: "21",
  loadAfterUnits: "18",
  loadAfterHours: "21",
  conflict: true,
  dissolved: false,
  otherReason: "",
  studentSignature: "Andrea M. Santos",
  signatures: {},
}

export const isLoadRevision = (type: string) => type.includes("Load Revision")

export const requestsSeed: RequestItem[] = [
  {
    id: "IIT-2025-1048",
    type: "Load Revision Form",
    student: "Andrea M. Santos",
    date: "May 22, 2025",
    stage: "College Dean",
    status: "Pending",
  },
  {
    id: "IIT-2025-1031",
    type: "Leave of Absence Form",
    student: "Andrea M. Santos",
    date: "May 18, 2025",
    stage: "Final Approval",
    status: "Approved",
  },
  {
    id: "IIT-2025-0987",
    type: "Shifter's Application Form",
    student: "Andrea M. Santos",
    date: "May 08, 2025",
    stage: "Student Revision",
    status: "Returned for Revision",
    reason:
      "Please attach a clearer statement explaining your intended program.",
  },
  {
    id: "IIT-2025-0912",
    type: "Load Revision Form",
    student: "Andrea M. Santos",
    date: "Apr 27, 2025",
    stage: "Completed",
    status: "Completed",
  },
]

export const approvalQueue: RequestItem[] = [
  {
    id: "IIT-2025-1056",
    type: "Leave of Absence Form",
    student: "Miguel A. Ramos",
    date: "May 24, 2025",
    stage: "Department Chair",
    status: "Pending",
  },
  {
    id: "IIT-2025-1052",
    type: "Load Revision Form",
    student: "Patricia L. Cruz",
    date: "May 23, 2025",
    stage: "Department Chair",
    status: "Pending",
  },
  {
    id: "IIT-2025-1048",
    type: "Load Revision Form",
    student: "Andrea M. Santos",
    date: "May 22, 2025",
    stage: "Department Chair",
    status: "Pending",
  },
]
export const formTypes = [
  {
    title: "Academic Load Revision Permit",
    desc: "Official permit to add or withdraw subjects and revise your academic load.",
    meta: "FM-MSU-IIT-RGTR-008",
    accent: "maroon",
  },
  {
    title: "Shifter's Application Form",
    desc: "Apply to shift or transfer from your current program to an intended program.",
    meta: "Program change",
    accent: "blue",
  },
  {
    title: "Leave of Absence Form",
    desc: "Request an approved temporary leave from your academic program.",
    meta: "Academic leave",
    accent: "amber",
  },
]
