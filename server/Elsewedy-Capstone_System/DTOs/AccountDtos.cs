using System;

namespace Elsewedy_Capstone_System.DTOs
{
    public class AccountCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
    }

    public class StudentCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
        public bool IsLeader { get; set; }
        public long? ClassId { get; set; }
    }

    public class SupervisorCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
    }

    public class ReviewerCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
        public long? AssignedClassId { get; set; }
    }

    public class AdminCreateDto
    {
        public string NationalId { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long AccountTypeId { get; set; }
    }

    public class AccountUpdateDto
    {
        public string Email { get; set; }
        public string NationalId { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long? AccountTypeId { get; set; }
        public long? StatusId { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ChangePasswordDto
    {
        public string NewPassword { get; set; }
    }

    public class StudentUpdateDto
    {
        public string Email { get; set; }
        public string NationalId { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long? AccountTypeId { get; set; }
        public long? StatusId { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsLeader { get; set; }
        public long? ClassId { get; set; }
    }

    public class ReviewerUpdateDto
    {
        public string Email { get; set; }
        public string NationalId { get; set; }
        public string FullNameEn { get; set; }
        public string FullNameAr { get; set; }
        public long? AccountTypeId { get; set; }
        public long? StatusId { get; set; }
        public bool? IsActive { get; set; }
        public long? AssignedClassId { get; set; }
    }
}


