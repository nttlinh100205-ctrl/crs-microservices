package com.example.apigateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class ApiKeyFilter implements GlobalFilter, Ordered {

    @Value("${partner.api-key}")
    private String validApiKey;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Bỏ qua kiểm tra nếu không phải API public courses
        if (!path.startsWith("/api/public/courses")) {
            return chain.filter(exchange);
        }

        // Kiểm tra X-API-KEY trong Header
        String apiKey = request.getHeaders().getFirst("X-API-KEY");
        if (apiKey == null || !apiKey.equals(validApiKey)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1; // Thứ tự ưu tiên chạy Filter (số càng nhỏ độ ưu tiên càng cao)
    }
}