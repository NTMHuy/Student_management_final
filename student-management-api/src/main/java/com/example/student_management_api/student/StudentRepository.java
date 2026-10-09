package com.example.student_management_api.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @Query("select s from Student s join fetch s.schoolClass order by s.studentCode")
    List<Student> findAllWithClass();

    @Query("select s from Student s join fetch s.schoolClass c where c.homeroomTeacher.id = :teacherId "
            + "order by s.studentCode")
    List<Student> findAllByHomeroomTeacher(@Param("teacherId") Long teacherId);

    @Query("select s from Student s join fetch s.schoolClass where s.id = :id")
    Optional<Student> findWithClassById(@Param("id") Long id);

    Optional<Student> findByStudentCodeIgnoreCase(String studentCode);

    long countBySchoolClassId(Long classId);

    List<Student> findBySchoolClassIdOrderByFullName(Long classId);

    /** Mỗi dòng: [classId, số học sinh]. */
    @Query("select s.schoolClass.id, count(s) from Student s group by s.schoolClass.id")
    List<Object[]> countGroupedByClass();
}
