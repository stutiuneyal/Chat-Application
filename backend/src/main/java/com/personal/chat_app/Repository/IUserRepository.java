package com.personal.chat_app.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.User;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Repository
public interface IUserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    List<User> findByNameRegex(Pattern pattern);

    List<User> findByEmailRegex(Pattern pattern);

}
