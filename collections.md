# PrepShare Database Collections Schema

Based on a deep analysis of `firebase-service.js`, `seed-database.html`, and all related application files, here is the complete, compiled schema mapping for the Firestore database.

---

## 1. Authentication & Users

### `users`
Stores all student and admin profiles.
*   **uid**: `String` (Firebase Auth ID / Document ID)
*   **name**: `String`
*   **email**: `String`
*   **mobile**: `String` (10-digit optional field collected via onboarding)
*   **role**: `String` (`'admin'` or `'student'`)
*   **profileImage**: `String` (SVG literal or URL)
*   **isActive**: `Boolean` (Soft-delete/Ban flag)
*   **currentDeviceId**: `String` (Used for concurrent login tracking)
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`
*   **lastLoginAt**: `Timestamp`
*   *(Optional Mock Test Tracking)*
    *   **totalMockExamsTaken**: `Number`
    *   **highestMockPercent**: `Number`
    *   **takenMockTestIds**: `Array<String>`

### `admin`
Authoritative collection to determine admin privileges without querying the massive users table.
*   **email**: `String`
*   **name**: `String`

---

## 2. Curriculum Management

### `courses`
Top-level container for a learning program.
*   **id**: `String` (Document ID)
*   **title**: `String`
*   **description**: `String`
*   **imageUrl**: `String`
*   **isDeleted**: `Boolean` (Soft-delete)
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

### `modules`
Sections within a course.
*   **id**: `String`
*   **courseId**: `String` (Foreign Key)
*   **title**: `String`
*   **order**: `Number` (Sorting index)
*   **isDeleted**: `Boolean`
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

### `topics`
Sub-sections within a module.
*   **id**: `String`
*   **courseId**: `String`
*   **moduleId**: `String`
*   **title**: `String`
*   **order**: `Number`
*   **isDeleted**: `Boolean`
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

### `lessons`
Actual video and resource content.
*   **id**: `String`
*   **courseId**: `String`
*   **moduleId**: `String`
*   **topicId**: `String`
*   **title**: `String`
*   **description**: `String`
*   **youtubeVideoId**: `String`
*   **youtubeUrl**: `String`
*   **durationSeconds**: `Number`
*   **isFreePreview**: `Boolean`
*   **resources**: `Array<Map>` (Links or file attachments)
*   **order**: `Number`
*   **isDeleted**: `Boolean`
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

---

## 3. Access Control & Commerce

### `enrollments`
Access tickets granting a specific user access to a specific course.
*   **id**: `String` (Format: `userId_courseId`)
*   **userId**: `String`
*   **courseId**: `String`
*   **paymentRequestId**: `String` (ID of the approved payment, or `"manually-granted"`)
*   **status**: `String` (`'active'` or `'revoked'`)
*   **enrolledAt**: `Timestamp`
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

### `paymentRequests`
Tracking for manual UPI payment submissions.
*   **id**: `String`
*   **userId**: `String`
*   **courseId**: `String`
*   **course**: `String` (Course title)
*   **name**: `String`
*   **email**: `String`
*   **utrNumber**: `String` (UPI Reference Number, previously documented as transactionId)
*   **amount**: `Number` (Expected amount calculated by backend)
*   **reportedAmount**: `Number` (Amount submitted by student)
*   **screenshotUrl**: `String` (Cloudinary URL)
*   **status**: `String` (`'pending'`, `'approved'`, or `'rejected'`)
*   **reviewedBy**: `String`
*   **reviewedAt**: `Timestamp`
*   **submittedAt**: `Timestamp`
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

---

## 4. Assessment & Progress Tracking

### `mocktests`
Admin-created exams.
*   **id**: `String`
*   **courseId**: `String`
*   **title**: `String`
*   **durationMinutes**: `Number`
*   **totalMarks**: `Number`
*   **questions**: `Array<Map>` (Contains question text, options, correct answer)
*   **createdAt**: `Timestamp`
*   **updatedAt**: `Timestamp`

### `mockAttempts`
Student submissions for exams.
*   **id**: `String`
*   **userId**: `String`
*   **testId**: `String`
*   **courseId**: `String`
*   **score**: `Number`
*   **totalMarks**: `Number`
*   **percent**: `Number`
*   **answers**: `Map<String, String>` (Maps Question IDs to Selected Options)
*   **createdAt**: `Timestamp`

### `lessonProgress`
Tracks which videos a student has completed.
*   **id**: `String`
*   **userId**: `String`
*   **lessonId**: `String`
*   **courseId**: `String`
*   **completed**: `Boolean`
*   **completedAt**: `Timestamp`

---

## 5. System Logs & Communications

### `activities`
System-wide audit trail. Tracks admin actions and key student events.
*   **id**: `String`
*   **userId**: `String`
*   **email**: `String`
*   **type**: `String` (e.g., `'login'`, `'user_deleted'`, `'payment_reviewed'`)
*   **description**: `String`
*   **timestamp**: `Timestamp`

### `notifications`
Global and targeted user alerts.
*   **id**: `String`
*   **title**: `String`
*   **message**: `String`
*   **recipientUid**: `String` (`'all'` for global announcements, or specific `uid`)
*   **createdAt**: `Timestamp`
