package com.portfolio.config;

import com.portfolio.service.email.EmailSender;
import com.portfolio.service.email.LoggingEmailSender;
import com.portfolio.service.email.ResendEmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EmailConfiguration {

    private static final Logger log = LoggerFactory.getLogger(EmailConfiguration.class);

    @Bean
    public EmailSender emailSender(AppProperties props) {
        AppProperties.Email email = props.email();
        String key = email == null ? null : email.resendApiKey();
        if (key != null && !key.isBlank()) {
            log.info("Email: Resend sender active (from={})", email.from());
            return new ResendEmailSender(key, email.from());
        }
        log.warn("Email: RESEND_API_KEY not set - emails will only be logged (dev mode)");
        return new LoggingEmailSender();
    }
}
