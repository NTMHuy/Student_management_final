package com.example.student_management_api.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @EntityGraph(attributePaths = {"studentClass", "studentClass.major"})
    List<Student> findAllByOrderByStudentCode();

    @EntityGraph(attributePaths = {"studentClass", "studentClass.major"})
    Optional<Student> findWithStudentClassById(Long id);

    boolean existsByEmailIgnoreCase(String email);

    // Compatibility queries for the legacy K-12 class-management module.
    @Query("select s.schoolClass.id, count(s) from Student s "
        + "where s.schoolClass is not null group by s.schoolClass.id")
    List<Object[]> countGroupedByClass();

    long countBySchoolClassId(Long schoolClassId);

    @EntityGraph(attributePaths = {"schoolClass"})
    Optional<Student> findByStudentCodeIgnoreCase(String studentCode);

    @EntityGraph(attributePaths = {"schoolClass"})
    List<Student> findBySchoolClassIdOrderByFullName(Long schoolClassId);
}