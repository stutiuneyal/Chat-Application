package com.personal.chat_app.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

        @Autowired
        private JwtAuthFilter authFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http.csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/auth/**", "/ws/**", "/actuator/health",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)
                                .httpBasic(Customizer.withDefaults());
                return http.build();
        }
}
