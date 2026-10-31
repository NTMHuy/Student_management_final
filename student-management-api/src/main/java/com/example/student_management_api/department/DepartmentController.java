package com.example.student_management_api.department;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentService service;
    private final ActorResolver actors;
    public DepartmentController(DepartmentService service, ActorResolver actors) {
        this.service = service; this.actors = actors;
    }
    @GetMapping public List<DepartmentResponse> list(@RequestParam(required=false) String search) {
        return service.list(search);
    }
    @GetMapping("/{id}") public DepartmentResponse get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public DepartmentResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DepartmentRequest request) {
        return service.create(actors.from(jwt), request);
    }
    @PutMapping("/{id}")
    public DepartmentResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return service.update(actors.from(jwt), id, request);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) { service.delete(actors.from(jwt), id); }
}