package plasmapi.project.plasma.service.logik.impl;


import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.repository.UserRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.UserService;

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
