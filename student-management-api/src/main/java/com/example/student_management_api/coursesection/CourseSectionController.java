package com.example.student_management_api.coursesection;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/course-sections")
public class CourseSectionController {
    private final CourseSectionService service;private final ActorResolver actors;
    public CourseSectionController(CourseSectionService service,ActorResolver actors){this.service=service;this.actors=actors;}
    @GetMapping public List<CourseSectionResponse> list(@RequestParam(required=false)Long semesterId,
        @RequestParam(required=false)Long subjectId,@RequestParam(required=false)String search){
        return service.list(semesterId,subjectId,search);
    }
    @GetMapping("/{id}")public CourseSectionResponse get(@PathVariable Long id){return service.get(id);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CourseSectionResponse create(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody CourseSectionRequest request){
        return service.create(actors.from(jwt),request);
    }
    @PutMapping("/{id}")
    public CourseSectionResponse update(@AuthenticationPrincipal Jwt jwt,@PathVariable Long id,@Valid @RequestBody CourseSectionRequest request){
        return service.update(actors.from(jwt),id,request);
    }
    @DeleteMapping("/{id}")@ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt,@PathVariable Long id){service.delete(actors.from(jwt),id);}
}