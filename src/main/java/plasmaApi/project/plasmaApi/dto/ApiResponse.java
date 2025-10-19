package plasmaApi.project.plasmaApi.dto;

public record ApiResponse<T>(
        T data,
        String message,
        int status
) {
}
