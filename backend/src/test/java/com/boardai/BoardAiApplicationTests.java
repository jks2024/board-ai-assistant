package com.boardai;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// 스프링 컨텍스트가 뜨는지 확인 (테스트 전용 DB 사용)
@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:mysql://localhost:3306/board_ai_test?createDatabaseIfNotExist=true"
				+ "&allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=Asia/Seoul",
		"spring.jpa.hibernate.ddl-auto=create-drop"
})
class BoardAiApplicationTests {

	@Test
	void contextLoads() {
	}

}
