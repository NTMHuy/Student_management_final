package com.example.student_management_api.coursesession;

import com.example.student_management_api.coursesection.CourseSection;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "course_sessions")
public class CourseSession {
    public enum Status { SCHEDULED, COMPLETED, CANCELLED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_section_id", nullable = false)
    private CourseSection courseSection;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(length = 100)
    private String room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.SCHEDULED;

    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() { return id; }
    public CourseSection getCourseSection() { return courseSection; }
    public void setCourseSection(CourseSection value) { courseSection = value; }
    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate value) { sessionDate = value; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime value) { startTime = value; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime value) { endTime = value; }
    public String getRoom() { return room; }
    public void setRoom(String value) { room = value; }
    public Status getStatus() { return status; }
    public void setStatus(Status value) { status = value; }
}
