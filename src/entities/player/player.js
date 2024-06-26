import {
    BoxGeometry,
    Mesh,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments,
    MeshPhongMaterial,
    MeshBasicMaterial,
} from "three";
import { scene } from "../../setup";
import { xOrigin, zOrigin, yOrigin } from "../../map/map";
import Debouncer from "../../debouncer";
import { roleColors } from "./role";
import { Rotation } from "../../camera";
import Raycast from "./raycast";
import animate_up from "./animations/animate_up";
import animate_down from "./animations/animate_down";
import animate_left from "./animations/animate_left";
import animate_right from "./animations/animate_right";
import { createPlayerSelector, removePlayerSelector } from "./player_selector";
/**
 * @import {teamType} from "../../game/teamController"
 * @import Role from "./role"
 */

/**
 *  Render a box in the scene
 *  @param {teamType} team The team color
 *  @param {Role} role The role of the player
 *  @param {Object} position The position of the box
 *  @param {number} position.x The x position of the box
 *  @param {number} position.y The y position of the box
 *  @param {number} position.z The z position of the box
 **/
export function renderPlayerBox(
    team = "blue",
    role = "dps",
    { x = xOrigin, y = yOrigin, z = zOrigin } = {x:xOrigin, y:yOrigin, z:zOrigin}
) {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshPhongMaterial({
        color: team,
    });
    const player = new Mesh(geometry, material);

    player.position.x = x;
    player.position.y = y;
    player.position.z = z;

    // Player can receive shadows
    player.receiveShadow = true;

    // Add the team and role to the cube
    player.userData = { team, role };

    // Create the edges of the cube
    const edges = new EdgesGeometry(geometry);
    const line = new LineBasicMaterial({
        color: roleColors[role],
        linewidth: 3,
    });
    const edgesCube = new LineSegments(edges, line);

    // Add the edges to the cube
    player.add(edgesCube);

    scene.add(player);

    return player;
}

const animationDuration = 150;

/**
 *
 * Animate the box movement in the scene
 *
 * @param {Mesh} player The box to animate
 * @param {'up' | 'down' | 'left' | 'right'} dir The direction of the movement
 * **/
function animateMove(player, dir) {
    const playerRaycast = new Raycast(player);

    function playMoveSound() {
        const audio = new Audio("/move.wav");
        audio.volume = 0.5;
        audio.play().then(() => {
            audio.remove();
        });
    }

    if (dir === "up") {
        animate_up(player, playerRaycast, animationDuration, playMoveSound);
        return;
    }

    if (dir === "down") {
        animate_down(player, playerRaycast, animationDuration, playMoveSound);
        return;
    }

    if (dir === "left") {
        animate_left(player, playerRaycast, animationDuration, playMoveSound);
        return;
    }

    if (dir === "right") {
        animate_right(player, playerRaycast, animationDuration, playMoveSound);
        return;
    }
}

/**
 * Move the player with the keyboard (WASD) and confirm the movement with the spacebar
 * @param {Mesh} player The player to move
 * **/
export function controllPlayer(player) {
    return new Promise((resolve) => {

        const selector = createPlayerSelector(player);

        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({
            color: player.userData.team,
            opacity: 0.5,
            transparent: true,
        });
        const tempBox = new Mesh(geometry, material);
        tempBox.position.set(
            player.position.x,
            player.position.y,
            player.position.z
        );

        const tempEdges = new EdgesGeometry(geometry);
        const line = new LineBasicMaterial({
            color: roleColors[player.userData.role],
        });
        const tempBoxEdges = new LineSegments(tempEdges, line);

        tempBox.add(tempBoxEdges);
        scene.add(tempBox);

        const actionDebouncer = new Debouncer();

        /**
         *
         * @param {KeyboardEvent} event
         * **/
        function move(event) {
            actionDebouncer.debounce(() => {
                if (event.key === "w") {
                    animateMove(tempBox, Rotation.getDirection("up"));
                    return;
                }
                if (event.key === "s") {
                    animateMove(tempBox, Rotation.getDirection("down"));
                    return;
                }

                if (event.key === "a") {
                    animateMove(tempBox, Rotation.getDirection("left"));
                    return;
                }

                if (event.key === "d") {
                    animateMove(tempBox, Rotation.getDirection("right"));
                    return;
                }
            }, animationDuration);
        }

        window.addEventListener("keydown", move);

        /**
         * @param {KeyboardEvent} event
         * **/
        function confirmMovement(event) {
            // Spacebar
            if (event.key === " ") {
                player.position.set(
                    tempBox.position.x,
                    tempBox.position.y,
                    tempBox.position.z
                );
                scene.remove(tempBox);
                window.removeEventListener("keydown", move);
                window.removeEventListener("keydown", confirmMovement);
                removePlayerSelector(player, selector);
                resolve(null);
            }
        }

        // Detect spacebar to confirm the movement
        window.addEventListener("keydown", confirmMovement);
    });
}
