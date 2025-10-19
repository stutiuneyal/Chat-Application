package com.personal.chat_app.Repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.User;
import java.util.Optional;

@Repository
public interface IUserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

}
