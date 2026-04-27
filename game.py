import math
import random

import asyncio

import pygame


WIDTH = 390
HEIGHT = 844
FPS = 60

BG = (92, 108, 124)
WHITE = (240, 240, 240)
CYAN = (90, 210, 240)
SHADOW = (55, 60, 65)
LANDING_RING = (255, 220, 120)
LOW_GROUND = (82, 96, 108)
MID_GROUND = (114, 126, 136)
HIGH_GROUND = (156, 168, 176)
PLATFORM_EDGE = (220, 226, 230)
PLATFORM_UNDER = (46, 54, 62)

DEFENSE_LINE_Y = HEIGHT - 120
ENEMY_SPAWN_MS = 900
ENEMY_RADIUS = 16
ENEMY_MIN_SPEED = 70
ENEMY_MAX_SPEED = 140

MIN_FLICK_DISTANCE = 20
MIN_GESTURE_DURATION = 0.03
SPEED_MULTIPLIER = 1.0
MIN_HORIZONTAL_SPEED = 250
MAX_HORIZONTAL_SPEED = 1100
HORIZONTAL_SPEED_MULTIPLIER = 0.9
VERTICAL_SPEED_MULTIPLIER = 0.2
GRAVITY = 1500
ENEMY_HIT_HEIGHT_MAX = 35
LANDING_HIT_RADIUS = 40


class Enemy:
    def __init__(self):
        self.base_x = random.randint(24, WIDTH - 24)
        self.x = float(self.base_x)
        self.y = -20
        self.speed = random.uniform(ENEMY_MIN_SPEED, ENEMY_MAX_SPEED)
        self.radius = ENEMY_RADIUS
        self.phase = random.uniform(0.0, math.tau)
        self.drift_speed = random.uniform(1.2, 2.0)
        self.drift_amount = random.uniform(10.0, 22.0)

    def progress(self):
        return max(0.0, min(1.0, self.y / DEFENSE_LINE_Y))

    def visual_scale(self):
        return 0.45 + self.progress() * 0.90

    def displayed_radius(self):
        return max(8, int(ENEMY_RADIUS * self.visual_scale()))

    def update(self, dt):
        progress = self.progress()
        speed_scale = 0.55 + progress * 1.35
        self.y += self.speed * speed_scale * dt

        drift_progress = self.progress()
        drift = math.sin((self.y * 0.018) + self.phase + dt * self.drift_speed * 2.0) * (
            self.drift_amount * (0.35 + drift_progress * 0.45)
        )
        self.x = self.base_x + drift

        displayed_radius = self.displayed_radius()
        self.x = max(displayed_radius, min(WIDTH - displayed_radius, self.x))

    def draw(self, surface):
        radius = self.displayed_radius()
        progress = self.progress()
        tone = 110 + int(progress * 110)
        body_color = (min(255, tone + 70), tone, max(70, tone - 18))
        pygame.draw.circle(surface, body_color, (int(self.x), int(self.y)), radius)
        pygame.draw.circle(surface, WHITE, (int(self.x), int(self.y)), radius, 2)

    def rect(self):
        radius = self.displayed_radius()
        return pygame.Rect(
            int(self.x - radius),
            int(self.y - radius),
            radius * 2,
            radius * 2,
        )

    def bottom(self):
        return self.y + self.displayed_radius()


class Projectile:
    def __init__(self, start_pos, direction, speed):
        self.ground_x = float(start_pos[0])
        self.ground_y = float(start_pos[1])
        self.height = 0.0
        self.vx = direction[0] * speed * HORIZONTAL_SPEED_MULTIPLIER
        self.vy = direction[1] * speed * HORIZONTAL_SPEED_MULTIPLIER
        self.vz = max(220.0, speed * VERTICAL_SPEED_MULTIPLIER)
        self.radius = 7

    def update(self, dt):
        self.ground_x += self.vx * dt
        self.ground_y += self.vy * dt
        self.height += self.vz * dt
        self.vz -= GRAVITY * dt
        landed = self.height <= 0.0
        if landed:
            self.height = 0.0
        return landed

    def visual_pos(self):
        return int(self.ground_x), int(self.ground_y - self.height)

    def ground_pos(self):
        return int(self.ground_x), int(self.ground_y)

    def draw(self, surface):
        screen_x, screen_y = self.visual_pos()
        shadow_x, shadow_y = self.ground_pos()

        shadow_scale = max(0.25, 1.0 - self.height / 220.0)
        shadow_w = max(8, int(24 * shadow_scale))
        shadow_h = max(4, int(8 * shadow_scale))
        shadow_rect = pygame.Rect(0, 0, shadow_w, shadow_h)
        shadow_rect.center = (shadow_x, shadow_y)
        pygame.draw.ellipse(surface, SHADOW, shadow_rect)

        pygame.draw.circle(surface, CYAN, (screen_x, screen_y), self.radius)
        pygame.draw.circle(surface, WHITE, (screen_x, screen_y), self.radius, 2)

    def offscreen(self):
        return (
            self.ground_x < -50
            or self.ground_x > WIDTH + 50
            or self.ground_y < -50
            or self.ground_y > HEIGHT + 50
        )

    def visual_rect(self):
        x, y = self.visual_pos()
        return pygame.Rect(x - self.radius, y - self.radius, self.radius * 2, self.radius * 2)


def normalize(dx, dy):
    length = math.hypot(dx, dy)
    if length == 0:
        return None
    return dx / length, dy / length


def draw_text(surface, font, text, color, x, y, center=False):
    rendered = font.render(text, True, color)
    rect = rendered.get_rect()
    if center:
        rect.center = (x, y)
    else:
        rect.topleft = (x, y)
    surface.blit(rendered, rect)


def spawn_landing_effect(position):
    return {
        "x": float(position[0]),
        "y": float(position[1]),
        "timer": 0.0,
        "duration": 0.18,
    }


def draw_terrain(surface):
    surface.fill(BG)

    # Distant low ground.
    pygame.draw.rect(surface, LOW_GROUND, (0, 0, WIDTH, DEFENSE_LINE_Y - 28))

    # Shadow band just below the defense line to imply height difference.
    pygame.draw.rect(surface, PLATFORM_UNDER, (0, DEFENSE_LINE_Y, WIDTH, 18))

    # High-ground platform.
    pygame.draw.rect(surface, HIGH_GROUND, (0, DEFENSE_LINE_Y + 18, WIDTH, HEIGHT - (DEFENSE_LINE_Y + 18)))

    # A clear horizontal defense edge.
    pygame.draw.line(surface, PLATFORM_EDGE, (0, DEFENSE_LINE_Y), (WIDTH, DEFENSE_LINE_Y), 4)
    pygame.draw.line(surface, (30, 36, 42), (0, DEFENSE_LINE_Y + 4), (WIDTH, DEFENSE_LINE_Y + 4), 2)

    # Simple horizontal depth layers in the upper ground only.
    for y in range(50, DEFENSE_LINE_Y - 40, 70):
        pygame.draw.line(surface, MID_GROUND, (0, y), (WIDTH, y), 1)


async def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Vertical Dart Defense")
    clock = pygame.time.Clock()

    title_font = pygame.font.SysFont(None, 42)
    hud_font = pygame.font.SysFont(None, 30)
    big_font = pygame.font.SysFont(None, 72)

    enemies = []
    projectiles = []
    landing_effects = []
    score = 0
    hp = 5
    game_over = False
    spawn_timer = 0.0

    aiming = False
    aim_start = None
    aim_start_time = 0.0

    while True:
        dt = clock.tick(FPS) / 1000.0

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return

            if game_over:
                continue

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                aiming = True
                aim_start = event.pos
                aim_start_time = pygame.time.get_ticks() / 1000.0
            elif event.type == pygame.MOUSEBUTTONUP and event.button == 1 and aiming:
                aiming = False
                aim_end = event.pos
                dx = aim_end[0] - aim_start[0]
                dy = aim_end[1] - aim_start[1]
                drag_distance = math.hypot(dx, dy)
                if drag_distance >= MIN_FLICK_DISTANCE:
                    direction = normalize(dx, dy)
                    if direction is not None:
                        release_time = pygame.time.get_ticks() / 1000.0
                        drag_duration = max(release_time - aim_start_time, MIN_GESTURE_DURATION)
                        gesture_speed = drag_distance / drag_duration
                        base_speed = gesture_speed * SPEED_MULTIPLIER
                        horizontal_speed = max(
                            MIN_HORIZONTAL_SPEED,
                            min(MAX_HORIZONTAL_SPEED, base_speed),
                        )
                        projectiles.append(Projectile(aim_end, direction, horizontal_speed))
                aim_start = None
                aim_start_time = 0.0

        if not game_over:
            spawn_timer += dt
            while spawn_timer >= ENEMY_SPAWN_MS / 1000.0:
                spawn_timer -= ENEMY_SPAWN_MS / 1000.0
                enemies.append(Enemy())

            for enemy in enemies:
                enemy.update(dt)

            for projectile in projectiles:
                projectile.update(dt)

            for effect in landing_effects:
                effect["timer"] += dt

            alive_enemies = []
            for enemy in enemies:
                if enemy.bottom() >= DEFENSE_LINE_Y:
                    hp -= 1
                    continue
                alive_enemies.append(enemy)
            enemies = alive_enemies

            alive_projectiles = []
            for projectile in projectiles:
                if projectile.offscreen():
                    continue

                landed = projectile.height <= 0
                if landed:
                    gx, gy = projectile.ground_pos()
                    hit_index = None
                    for i, enemy in enumerate(enemies):
                        if math.hypot(enemy.x - gx, enemy.y - gy) <= LANDING_HIT_RADIUS + enemy.radius:
                            hit_index = i
                            break
                    if hit_index is not None:
                        score += 1
                        enemies.pop(hit_index)
                    landing_effects.append(spawn_landing_effect((gx, gy)))
                    continue

                hit_index = None
                if projectile.height <= ENEMY_HIT_HEIGHT_MAX:
                    proj_rect = projectile.visual_rect()
                    for i, enemy in enumerate(enemies):
                        if proj_rect.colliderect(enemy.rect()):
                            hit_index = i
                            break
                if hit_index is not None:
                    score += 1
                    enemies.pop(hit_index)
                    landing_effects.append(spawn_landing_effect(projectile.ground_pos()))
                    continue

                alive_projectiles.append(projectile)
            projectiles = alive_projectiles

            landing_effects = [
                effect for effect in landing_effects if effect["timer"] < effect["duration"]
            ]

            if hp <= 0:
                hp = 0
                game_over = True

        draw_terrain(screen)

        for enemy in enemies:
            enemy.draw(screen)

        for effect in landing_effects:
            progress = effect["timer"] / effect["duration"]
            radius = int(10 + progress * 18)
            alpha = int(180 * (1.0 - progress))
            ring_surface = pygame.Surface((radius * 2 + 4, radius * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(
                ring_surface,
                (LANDING_RING[0], LANDING_RING[1], LANDING_RING[2], alpha),
                (radius + 2, radius + 2),
                radius,
                2,
            )
            screen.blit(ring_surface, (int(effect["x"] - radius - 2), int(effect["y"] - radius - 2)))

        for projectile in projectiles:
            projectile.draw(screen)

        draw_text(screen, hud_font, f"Score: {score}", WHITE, 16, 14)
        hp_text = hud_font.render(f"HP: {hp}", True, WHITE)
        screen.blit(hp_text, hp_text.get_rect(topright=(WIDTH - 16, 14)))

        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 150))
            screen.blit(overlay, (0, 0))
            draw_text(screen, big_font, "GAME OVER", WHITE, WIDTH // 2, HEIGHT // 2 - 20, center=True)
            draw_text(
                screen,
                title_font,
                f"Final Score: {score}",
                WHITE,
                WIDTH // 2,
                HEIGHT // 2 + 34,
                center=True,
            )

        pygame.display.flip()
        await asyncio.sleep(0)


if __name__ == "__main__":
    asyncio.run(main())
