package com.example.student_management_api.enrollment;

import com.example.student_management_api.coursesection.CourseSection;
import com.example.student_management_api.student.Student;
import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "enrollments", uniqueConstraints = @UniqueConstraint(name = "uq_enrollments_student_section", columnNames = {"student_id","course_section_id"}))
public class Enrollment {
    public enum Status { REGISTERED, ACTIVE, WITHDRAWN, COMPLETED, FAILED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_section_id", nullable = false)
    private CourseSection courseSection;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Status status = Status.REGISTERED;
    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private Instant enrolledAt;
    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @PrePersist
    void initializeEnrolledAt(){if(enrolledAt==null) enrolledAt=Instant.now();}
    public Long getId(){return id;}
    public Student getStudent(){return student;}
    public void setStudent(Student v){student=v;}
    public CourseSection getCourseSection(){return courseSection;}
    public void setCourseSection(CourseSection v){courseSection=v;}
    public Status getStatus(){return status;}
    public void setStatus(Status v){status=v;}
    public Instant getEnrolledAt(){return enrolledAt;}
    public Instant getWithdrawnAt(){return withdrawnAt;}
    public void setWithdrawnAt(Instant v){withdrawnAt=v;}
}