DROP DATABASE IF EXISTS hapms_db;
CREATE DATABASE hapms_db;
USE hapms_db;

CREATE TABLE UserTable (
    UserID VARCHAR(20) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    LastLogin DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE DepartmentTable (
    DepartmentID VARCHAR(20) PRIMARY KEY,
    DepartmentName VARCHAR(100) UNIQUE NOT NULL,
    Description VARCHAR(255),
    Location VARCHAR(100),
    HeadOfDepartment VARCHAR(20),
    ContactExtension VARCHAR(10),
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE DoctorTable (
    DoctorID VARCHAR(20) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Specialization VARCHAR(100),
    Qualification VARCHAR(100),
    LicenseNumber VARCHAR(30) UNIQUE NOT NULL,
    ContactNumber VARCHAR(20),
    Email VARCHAR(100),
    DepartmentID VARCHAR(20),
    AvailabilityStatus VARCHAR(20),
    ConsultationFee DECIMAL(10,2),
    UserID VARCHAR(20),
    FOREIGN KEY (DepartmentID) REFERENCES DepartmentTable(DepartmentID),
    FOREIGN KEY (UserID) REFERENCES UserTable(UserID) ON DELETE CASCADE
);

ALTER TABLE DepartmentTable
ADD FOREIGN KEY (HeadOfDepartment) REFERENCES DoctorTable(DoctorID);

CREATE TABLE PatientTable (
    PatientID VARCHAR(20) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    DateOfBirth DATE,
    Gender VARCHAR(10),
    ContactNumber VARCHAR(20),
    Email VARCHAR(100) UNIQUE,
    StreetAddress VARCHAR(100),
    City VARCHAR(50),
    PostalCode VARCHAR(10),
    BloodGroup VARCHAR(5),
    EmergencyContactName VARCHAR(100),
    EmergencyContactPhone VARCHAR(20),
    RegistrationDate DATE,
    UserID VARCHAR(20),
    FOREIGN KEY (UserID) REFERENCES UserTable(UserID) ON DELETE CASCADE
);

CREATE TABLE AdministratorTable (
    AdminID VARCHAR(20) PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    AccessLevel VARCHAR(30),
    AssignedModules VARCHAR(255),
    FOREIGN KEY (AdminID) REFERENCES UserTable(UserID) ON DELETE CASCADE
);

CREATE TABLE AppointmentTable (
    AppointmentID VARCHAR(20) PRIMARY KEY,
    PatientID VARCHAR(20) NOT NULL,
    DoctorID VARCHAR(20) NOT NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    Duration INT,
    Status VARCHAR(20) DEFAULT 'Scheduled',
    ReasonForVisit VARCHAR(255),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PatientID) REFERENCES PatientTable(PatientID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorID) REFERENCES DoctorTable(DoctorID) ON DELETE CASCADE,
    CONSTRAINT unique_doctor_timeslot UNIQUE (DoctorID, AppointmentDate, AppointmentTime) 
);

CREATE TABLE MedicalRecordTable (
    RecordID VARCHAR(20) PRIMARY KEY,
    PatientID VARCHAR(20) NOT NULL,
    DoctorID VARCHAR(20) NOT NULL,
    AppointmentID VARCHAR(20),
    VisitDate DATE NOT NULL,
    Diagnosis TEXT,
    Symptoms TEXT,
    Prescription TEXT,
    TreatmentPlan TEXT,
    LabResultsSummary TEXT,
    FollowUpRequired BOOLEAN,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PatientID) REFERENCES PatientTable(PatientID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorID) REFERENCES DoctorTable(DoctorID) ON DELETE CASCADE,
    FOREIGN KEY (AppointmentID) REFERENCES AppointmentTable(AppointmentID) ON DELETE SET NULL
);

USE hapms_db;

INSERT INTO DepartmentTable (DepartmentID, DepartmentName, Description, Location, ContactExtension, IsActive)
VALUES ('DEPT-01', 'General Medicine', 'General adult and primary care', 'Room 204 | Main Hospital', '1011', TRUE);

INSERT INTO UserTable (UserID, Username, PasswordHash, Role, Email, IsActive)
VALUES ('USR-D01', 'olivia.chen', '$2b$10$dummyhashvalue12345678901234567890', 'Doctor', 'ochen@hapms.com', TRUE);

INSERT INTO DoctorTable (DoctorID, FirstName, LastName, Specialization, Qualification, LicenseNumber, ContactNumber, Email, DepartmentID, AvailabilityStatus, ConsultationFee, UserID)
VALUES ('DOC-001', 'Olivia', 'Chen', 'General Practice', 'MBChB', 'MED-102938', '0821112222', 'ochen@hapms.com', 'DEPT-01', 'Available', 500.00, 'USR-D01');

UPDATE DepartmentTable 
SET HeadOfDepartment = 'DOC-001' 
WHERE DepartmentID = 'DEPT-01';

USE hapms_db;

INSERT INTO UserTable (UserID, Username, PasswordHash, Role, Email, IsActive) 
VALUES ('USR-DEMO', 'demopatient', 'dummyhash123', 'Patient', 'demo@hapms.com', TRUE);

INSERT INTO PatientTable (PatientID, FirstName, LastName, Email, UserID) 
VALUES ('demo-patient', 'Emma', 'Bennett', 'demo@hapms.com', 'USR-DEMO');