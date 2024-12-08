#version 460 core

layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba32f, binding = 0) uniform image3D img_output;

uniform sampler3D u_inputImg;

uniform float mu_density;
uniform float mu_velocity;
uniform float dt;

void set_boundary(ivec3 coords, ivec3 dims, inout vec4 pixel) {
    if(coords.x == 0) {
        pixel.r = texelFetch(u_inputImg, coords + ivec3(1, 0, 0), 0).r;
        pixel.ba *= -1.0;
    }
    if(coords.x == dims.x - 1) {
        pixel.r = texelFetch(u_inputImg, coords + ivec3(-1, 0, 0), 0).r;
        pixel.ba *= -1.0;
    }
    if(coords.y == 0) {
        pixel.r = texelFetch(u_inputImg, coords + ivec3(0, 1, 0), 0).r;
        pixel.ga *= -1.0;
    }
    if(coords.y == dims.y - 1) {
        pixel.r = texelFetch(u_inputImg, coords + ivec3(0, -1, 0), 0).r;
        pixel.ga *= -1.0;
    }
    if(coords.z == 0) {
        pixel.r = texelFetch(u_inputImg, coords + ivec3(0, 0, 1), 0).r;
        pixel.gb *= -1.0;
    }
    if(coords.z == dims.z - 1) {
        pixel.r = texelFetch(u_inputImg, coords + ivec3(0, 0, -1), 0).r;
        pixel.gb *= -1.0;
    }

    imageStore(img_output, coords, pixel);

}

void main() {
    ivec3 dims = imageSize(img_output);
    ivec3 coords = ivec3(gl_GlobalInvocationID.xyz);

    vec4 density = texelFetch(u_inputImg, coords, 0);
    vec4 densityL = texelFetch(u_inputImg, coords + ivec3(-1, 0, 0), 0);
    vec4 densityR = texelFetch(u_inputImg, coords + ivec3(+1, 0, 0), 0);
    vec4 densityB = texelFetch(u_inputImg, coords + ivec3(0, -1, 0), 0);
    vec4 densityT = texelFetch(u_inputImg, coords + ivec3(0, +1, 0), 0);
    vec4 densityD = texelFetch(u_inputImg, coords + ivec3(0, 0, -1), 0);
    vec4 densityU = texelFetch(u_inputImg, coords + ivec3(0, 0, +1), 0);

    vec4 sum = densityL + densityR + densityB + densityT + densityD + densityU;

    vec4 res;
    res.r = (density.r + mu_density * dt * sum.r) / (1.0 + 6.0 * mu_density * dt);
    res.gba = (density.gba + mu_velocity * dt * sum.gba) / (1.0 + 6.0 * mu_velocity * dt);

    if(coords.x == 0 || coords.y == 0 || coords.z == 0 || coords.x == dims.x - 1 || coords.y == dims.y - 1 || coords.z == dims.z - 1) {
        set_boundary(coords, dims, res);
    }

	imageStore(img_output, coords, res);
}