-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "SiteMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roles" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "SiteMembership_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SiteMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Moc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "degreeOfHazard" TEXT,
    "significance" TEXT,
    "formData" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "closedAt" DATETIME,
    CONSTRAINT "Moc_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Moc_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Moc_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "assignedToId" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "signedName" TEXT,
    "comment" TEXT,
    "decidedAt" DATETIME,
    CONSTRAINT "Approval_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Approval_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "category" TEXT,
    "label" TEXT NOT NULL,
    "answer" TEXT,
    "remarks" TEXT,
    "ownerId" TEXT,
    "requiredPhase" TEXT,
    "completedAt" DATETIME,
    "completedById" TEXT,
    CONSTRAINT "ChecklistResponse_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistResponse_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChecklistResponse_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "ownerId" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionItem_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Addendum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "technicalBasis" TEXT NOT NULL,
    "seAssessment" TEXT,
    "createdById" TEXT NOT NULL,
    "approverId" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "signedName" TEXT,
    "comment" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Addendum_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Addendum_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Addendum_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtensionReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "assumptionsValid" BOOLEAN NOT NULL,
    "extensionDate" DATETIME NOT NULL,
    "comment" TEXT,
    "reviewedById" TEXT NOT NULL,
    "signedName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtensionReview_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtensionReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BypassLogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BypassLogEntry_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BypassLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mocId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEntry_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "Moc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mocId" TEXT,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SiteMembership_siteId_userId_key" ON "SiteMembership"("siteId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Moc_number_key" ON "Moc"("number");

-- CreateIndex
CREATE INDEX "Moc_siteId_status_idx" ON "Moc"("siteId", "status");

-- CreateIndex
CREATE INDEX "Moc_status_idx" ON "Moc"("status");

-- CreateIndex
CREATE INDEX "Approval_mocId_stage_idx" ON "Approval"("mocId", "stage");

-- CreateIndex
CREATE INDEX "Approval_assignedToId_decision_idx" ON "Approval"("assignedToId", "decision");

-- CreateIndex
CREATE INDEX "ChecklistResponse_mocId_kind_idx" ON "ChecklistResponse"("mocId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistResponse_mocId_kind_itemKey_key" ON "ChecklistResponse"("mocId", "kind", "itemKey");

-- CreateIndex
CREATE INDEX "ActionItem_mocId_status_idx" ON "ActionItem"("mocId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionReview_mocId_number_key" ON "ExtensionReview"("mocId", "number");

-- CreateIndex
CREATE INDEX "AuditEntry_mocId_idx" ON "AuditEntry"("mocId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
