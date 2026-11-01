package com.example.student_management_api.enrollment;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {
    private final EnrollmentService service;
    private final ActorResolver actors;

    public EnrollmentController(EnrollmentService service, ActorResolver actors) {
        this.service = service;
        this.actors = actors;
    }

    @GetMapping
    public List<EnrollmentResponse> list(
        @RequestParam(required = false) Long courseSectionId,
        @RequestParam(required = false) Long studentId,
        @RequestParam(required = false) String status
    ) {
        return service.list(courseSectionId, studentId, status);
    }

    @GetMapping("/{id}")
    public EnrollmentResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentResponse create(@AuthenticationPrincipal Jwt jwt,
                                     @Valid @RequestBody EnrollmentRequest request) {
        return service.create(actors.from(jwt), request);
    }

    @PatchMapping("/{id}/status")
    public EnrollmentResponse updateStatus(@AuthenticationPrincipal Jwt jwt,
                                            @PathVariable Long id,
                                            @RequestParam String status) {
        return service.updateStatus(actors.from(jwt), id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(actors.from(jwt), id);
    }
}
