package com.example.student_management_api.schoolclass;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {

    @Query("select c from SchoolClass c left join fetch c.homeroomTeacher order by c.gradeLevel, c.className")
    List<SchoolClass> findAllWithTeacher();

    @Query("select c from SchoolClass c join fetch c.homeroomTeacher t where t.id = :teacherId "
            + "order by c.gradeLevel, c.className")
    List<SchoolClass> findAllByTeacherWithTeacher(@Param("teacherId") Long teacherId);

    @Query("select c from SchoolClass c left join fetch c.homeroomTeacher where c.id = :id")
    Optional<SchoolClass> findWithTeacherById(@Param("id") Long id);

    Optional<SchoolClass> findByClassNameIgnoreCase(String className);
}
