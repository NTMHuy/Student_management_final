package com.example.student_management_api.semester;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/semesters")
public class SemesterController {
    private final SemesterService service; private final ActorResolver actors;
    public SemesterController(SemesterService service,ActorResolver actors){this.service=service;this.actors=actors;}
    @GetMapping public List<SemesterResponse> list(){return service.list();}
    @GetMapping("/{id}") public SemesterResponse get(@PathVariable Long id){return service.get(id);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public SemesterResponse create(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody SemesterRequest request){
        return service.create(actors.from(jwt),request);
    }
    @PutMapping("/{id}")
    public SemesterResponse update(@AuthenticationPrincipal Jwt jwt,@PathVariable Long id,@Valid @RequestBody SemesterRequest request){
        return service.update(actors.from(jwt),id,request);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt,@PathVariable Long id){service.delete(actors.from(jwt),id);}
}