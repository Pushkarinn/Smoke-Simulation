#ifndef VOXEL_TEXTURE_HPP
#define VOXEL_TEXTURE_HPP

#include "gl_includes.hpp"
#include "shader.hpp"
#include "texture3D.hpp"
#include "compute_shader.hpp"

class Simulation {
public:
    Texture3D densVelTexture{};
    Texture3D divergenceTexture{};
    Texture3D divFreeTexture{};
    Texture3D curlTexture{};

    ComputeShader diffuseShader{};
    ComputeShader advectShader{};
    ComputeShader divShader{};
    ComputeShader solveDivShader{};
    ComputeShader nablaGShader{};
    ComputeShader curlShader{};
    ComputeShader confForceShader{};

    GLuint dimXZ{};
    GLuint dimY{};

    std::vector<float> data{};

public:
    Simulation() {
        dimXZ = 128;
        dimY = 256;
    }
    ~Simulation() {
    }

    int index(int x, int y, int z, int channel) {
        return 4 * (x + y * dimXZ + z * dimXZ * dimY) + channel;
    }

    void generate_data() {

        data.resize(dimXZ * dimY * dimXZ * 4);
        data.assign(dimXZ * dimY * dimXZ * 4, 0.0f);

        for (int i = 0; i < dimXZ; i++) {
            for (int j = 0; j < dimY; j++) {
                for (int k = 0; k < dimXZ; k++) {
                    int distSq = pow(i - 64, 2) + pow(j - 16, 2) + pow(k - 64, 2);
                    float val = distSq < 16 * 16 ? 1.0f : 0.0f;
                    data[index(i, j, k, 0)] = val;

                    data[index(i, j, k, 2)] = val * 45.0f;
                }
            }
        }

    }

    void init_textures() {
        generate_data();

        diffuseShader.init("../data/shaders/compute/diffuse.glsl", dimXZ, dimY);
        advectShader.init("../data/shaders/compute/advect.glsl", dimXZ, dimY);
        divShader.init("../data/shaders/compute/div.glsl", dimXZ, dimY);
        solveDivShader.init("../data/shaders/compute/solve_div.glsl", dimXZ, dimY);
        nablaGShader.init("../data/shaders/compute/nabla_g.glsl", dimXZ, dimY);
        curlShader.init("../data/shaders/compute/curl.glsl", dimXZ, dimY);
        confForceShader.init("../data/shaders/compute/conf_force.glsl", dimXZ, dimY);

        densVelTexture.init(dimXZ, dimY, data);
        divergenceTexture.init(dimXZ, dimY);

        std::vector<float> zeroData(dimXZ * dimY * dimXZ * 4, 0.0f);
        divFreeTexture.init(dimXZ, dimY, zeroData);
        curlTexture.init(dimXZ, dimY, zeroData);
    }

    void simulationStep(glm::vec3 targetSize, glm::vec3 targetOffest, float dt) {
        //std::cout << "Generating voxel texture..." << std::endl;

        diffuseShader.use();

        setUniform(diffuseShader.id(), "dt", dt);
        setUniform(diffuseShader.id(), "mu_density", 0.005f);
        setUniform(diffuseShader.id(), "mu_velocity", 0.001f);

        for (int i = 0; i < 15; i++) {
            diffuseShader.run({ &densVelTexture }, { "u_inputImg" }, &densVelTexture);
        }

        advectShader.use();

        setUniform(advectShader.id(), "dt", dt);
        setUniform(advectShader.id(), "u_mask", glm::vec4(0.0f, 1.0f, 1.0f, 1.0f));

        advectShader.run({ &densVelTexture, &densVelTexture }, { "u_inputImg", "u_velocity" }, &densVelTexture);

        curlShader.use();
        curlShader.run({ &densVelTexture }, { "u_inputImg" }, &curlTexture);

        confForceShader.use();
        setUniform(confForceShader.id(), "dt", dt);
        confForceShader.run({ &densVelTexture, &curlTexture }, { "u_inputImg", "u_curl" }, &densVelTexture);

        divShader.use();
        divShader.run({ &densVelTexture }, { "u_inputImg" }, &divergenceTexture);

        std::vector<float> divFreeData(dimXZ * dimY * dimXZ * 4, 0.0f); // Reset the div free texture 
        divFreeTexture.init(dimXZ, dimY, divFreeData);

        solveDivShader.use();
        for (int i = 0; i < 15; i++) {
            solveDivShader.run({ &divFreeTexture, &divergenceTexture }, { "u_inputImg", "u_divergence" }, &divFreeTexture);
        }

        nablaGShader.use();
        nablaGShader.run({ &divFreeTexture, &densVelTexture }, { "u_inputImg", "u_velocity" }, &densVelTexture);

        advectShader.use();

        setUniform(advectShader.id(), "dt", dt);
        setUniform(advectShader.id(), "u_mask", glm::vec4(1.0f, 0.0f, 0.0f, 0.0f));

        advectShader.run({ &densVelTexture, &densVelTexture }, { "u_inputImg", "u_velocity" }, &densVelTexture);

        glBindImageTexture(0, 0, 0, GL_FALSE, 0, GL_READ_WRITE, GL_RGBA32F);
        glBindTexture(GL_TEXTURE_3D, 0);

        glUseProgram(0);
    }

    GLuint getTextureID(int tex) {
        switch (tex) {
        case 1:
            return divergenceTexture.textureID;
        case 2:
            return divFreeTexture.textureID;
        case 3:
            return curlTexture.textureID;
        default:
            return densVelTexture.textureID;
        }
    }
};

#endif // voxeltexture.hpp