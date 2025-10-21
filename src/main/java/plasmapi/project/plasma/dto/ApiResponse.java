package plasmapi.project.plasma.dto;

public record ApiResponse<T>(
        T data,
        String message,
        int status
) {
}
