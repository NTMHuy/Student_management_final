package com.example.student_management_api.studentclass;

import com.example.student_management_api.major.Major;
import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "student_classes")
public class StudentClass {
    public enum Status { ACTIVE, ARCHIVED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "major_id", nullable = false)
    private Major major;
    @Column(name = "class_code", nullable = false, unique = true, length = 20)
    private String classCode;
    @Column(name = "class_name", nullable = false, length = 100)
    private String className;
    @Column(name = "intake_year", nullable = false)
    private Short intakeYear;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    public Long getId(){return id;}
    public Major getMajor(){return major;}
    public void setMajor(Major v){major=v;}
    public String getClassCode(){return classCode;}
    public void setClassCode(String v){classCode=v;}
    public String getClassName(){return className;}
    public void setClassName(String v){className=v;}
    public Short getIntakeYear(){return intakeYear;}
    public void setIntakeYear(Short v){intakeYear=v;}
    public Status getStatus(){return status;}
    public void setStatus(Status v){status=v;}
}