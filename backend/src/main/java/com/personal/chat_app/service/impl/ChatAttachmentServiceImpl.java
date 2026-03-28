package com.personal.chat_app.service.impl;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.personal.chat_app.dto.UploadedAttachmentDto;
import com.personal.chat_app.service.IChatAttachmentService;

@Service
public class ChatAttachmentServiceImpl implements IChatAttachmentService {

        @Value("${supabase.url}")
        private String supabaseUrl;

        @Value("${supabase.service-role-key}")
        private String serviceRoleKey;

        @Value("${supabase.storage.bucket}")
        private String bucket;

        private final RestTemplate restTemplate = new RestTemplate();

        @Override
        public List<UploadedAttachmentDto> uploadFiles(String roomId, String userEmail, List<MultipartFile> files) {
                List<UploadedAttachmentDto> result = new ArrayList<>();

                for (MultipartFile file : files) {
                        try {
                                String originalName = file.getOriginalFilename();
                                String safeName = originalName != null
                                                ? Normalizer.normalize(originalName, Normalizer.Form.NFKD)
                                                                .replaceAll("[^a-zA-Z0-9\\.\\-_]", "_")
                                                : "file";

                                String storagePath = "rooms/" + roomId + "/" + Instant.now().toEpochMilli() + "-"
                                                + UUID.randomUUID() + "-" + safeName;

                                String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + storagePath;

                                String rawContentType = file.getContentType();
                                String safeContentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

                                if (rawContentType != null && !rawContentType.isBlank()) {
                                        safeContentType = rawContentType.split(";")[0].trim();
                                }

                                HttpHeaders headers = new HttpHeaders();
                                headers.set("apikey", serviceRoleKey);
                                headers.setBearerAuth(serviceRoleKey);
                                headers.setContentType(MediaType.parseMediaType(safeContentType));
                                headers.set("x-upsert", "false");

                                HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);

                                ResponseEntity<String> response = restTemplate.exchange(
                                                uploadUrl,
                                                HttpMethod.POST,
                                                entity,
                                                String.class);

                                if (!response.getStatusCode().is2xxSuccessful()) {
                                        throw new RuntimeException("Supabase upload failed");
                                }

                                String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/"
                                                + URLEncoder.encode(storagePath, StandardCharsets.UTF_8).replace("+",
                                                                "%20");

                                result.add(
                                                UploadedAttachmentDto.builder()
                                                                .fileName(file.getOriginalFilename())
                                                                .url(publicUrl)
                                                                .contentType(safeContentType)
                                                                .size(file.getSize())
                                                                .storagePath(storagePath)
                                                                .build());
                        } catch (IOException e) {
                                throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
                        }
                }

                return result;
        }
}