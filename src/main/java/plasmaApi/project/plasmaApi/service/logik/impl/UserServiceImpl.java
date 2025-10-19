package plasmaApi.project.plasmaApi.service.logik.impl;


import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.model.security.User;
import plasmaApi.project.plasmaApi.repository.UserRepository;
import plasmaApi.project.plasmaApi.service.logik.AbstractMotherService;
import plasmaApi.project.plasmaApi.service.logik.UserService;

import java.util.Optional;


@Service
public class UserServiceImpl extends AbstractMotherService<User, Integer> implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository repository) {
        super(repository);
        this.userRepository = repository;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
