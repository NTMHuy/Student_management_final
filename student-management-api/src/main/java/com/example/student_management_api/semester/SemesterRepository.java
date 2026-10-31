package com.example.student_management_api.semester;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByAcademicYearAndTermNumber(String academicYear, Short termNumber);
    boolean existsByAcademicYearAndTermNumber(String academicYear, Short termNumber);
}