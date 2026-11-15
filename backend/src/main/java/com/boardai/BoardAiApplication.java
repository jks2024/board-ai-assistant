package com.boardai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan   // RagProperties(@ConfigurationProperties record) 등록
public class BoardAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(BoardAiApplication.class, args);
	}

}
