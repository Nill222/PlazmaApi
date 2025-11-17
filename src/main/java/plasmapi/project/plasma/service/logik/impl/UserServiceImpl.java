package plasmapi.project.plasma.service.logik.impl;


import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.user.UserCreateDto;
import plasmapi.project.plasma.mapper.user.UserCreateMapper;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.repository.UserRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.UserService;

import java.util.Optional;


@Service
public class UserServiceImpl extends AbstractMotherService<User, Integer, UserCreateDto> implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository repository, UserCreateMapper mapper) {
        super(repository, mapper);
        this.userRepository = repository;
    }

    @Override
    public Optional<User> findByUsername(String username) {
        if(!userRepository.existsByUsername(username)){
            throw new NotFoundException("Пользователь с таким именем не найден");
        }
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if(!userRepository.existsByEmail(email)){
            throw new NotFoundException("Пользователь с таким email не найден");
        }
        return userRepository.findByEmail(email);
    }
}
