#ifndef VOXEL_TEXTURE_HPP
#define VOXEL_TEXTURE_HPP

#include "gl_includes.hpp"
#include "shader.hpp"
#include "texture3D.hpp"
#include "compute_shader.hpp"

class VoxelTexture {
public:
    Texture3D densVelTexture{};
    Texture3D divergenceTexture{};
    Texture3D divFreeTexture{};

    ComputeShader diffuseShader{};
    ComputeShader advectShader{};
    ComputeShader divShader{};
    ComputeShader solveDivShader{};
    ComputeShader nablaGShader{};

    GLuint dimXZ{};
    GLuint dimY{};

    std::vector<float> data{};

public:
    VoxelTexture() {
        dimXZ = 128;
        dimY = 128;
    }
    ~VoxelTexture() {
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
                    int distSq = pow(i - 16, 2) + pow(j - 64, 2) + pow(k - 64, 2);
                    float val = distSq < 16 * 16 ? 1.0f : 0.0f;
                    data[index(i, j, k, 0)] = val;

                    data[index(i, j, k, 1)] = val * 45.0f;
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

        densVelTexture.init(dimXZ, dimY, data);
        divergenceTexture.init(dimXZ, dimY);

        std::vector<float> divFreeData(dimXZ * dimY * dimXZ * 4, 0.0f);
        divFreeTexture.init(dimXZ, dimY, divFreeData);
    }

    void simulationStep(glm::vec3 targetSize, glm::vec3 targetOffest, float dt) {
        //std::cout << "Generating voxel texture..." << std::endl;

        diffuseShader.use();

        setUniform(diffuseShader.id(), "dt", dt);
        setUniform(diffuseShader.id(), "mu_density", 0.005f);
        setUniform(diffuseShader.id(), "mu_velocity", 0.001f);
        setUniform(diffuseShader.id(), "u_inputImg", 0);

        glActiveTexture(GL_TEXTURE0);
        densVelTexture.bind();

        glBindImageTexture(0, densVelTexture.textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        for (int i = 0; i < 15; i++) {
            diffuseShader.run();
        }

        glActiveTexture(GL_TEXTURE0);
        densVelTexture.bind();

        advectShader.use();

        setUniform(advectShader.id(), "dt", dt);
        setUniform(advectShader.id(), "u_inputImg", 0);
        setUniform(advectShader.id(), "u_velocity", 0);
        setUniform(advectShader.id(), "u_mask", glm::vec4(0.0f, 1.0f, 1.0f, 1.0f));

        advectShader.run();

        divShader.use();

        setUniform(divShader.id(), "u_inputImg", 0);

        glBindImageTexture(0, divergenceTexture.textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        divShader.run();

        solveDivShader.use();
        setUniform(solveDivShader.id(), "u_inputImg", 0);
        setUniform(solveDivShader.id(), "u_divergence", 1);

        // Reset the divFreeTexture
        std::vector<float> divFreeData(dimXZ * dimY * dimXZ * 4, 0.0f);
        divFreeTexture.init(dimXZ, dimY, divFreeData);

        glActiveTexture(GL_TEXTURE0);
        divFreeTexture.bind();
        glActiveTexture(GL_TEXTURE1);
        divergenceTexture.bind();

        glBindImageTexture(0, divFreeTexture.textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        for (int i = 0; i < 15; i++) {
            solveDivShader.run();
        }

        nablaGShader.use();
        setUniform(nablaGShader.id(), "u_inputImg", 0);
        setUniform(nablaGShader.id(), "u_velocity", 1);

        glActiveTexture(GL_TEXTURE0);
        divFreeTexture.bind();
        glActiveTexture(GL_TEXTURE1);
        densVelTexture.bind();

        glBindImageTexture(0, densVelTexture.textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        nablaGShader.run();

        glActiveTexture(GL_TEXTURE0);
        densVelTexture.bind();

        advectShader.use();

        setUniform(advectShader.id(), "dt", dt);
        setUniform(advectShader.id(), "u_inputImg", 0);
        setUniform(advectShader.id(), "u_velocity", 0);
        setUniform(advectShader.id(), "u_mask", glm::vec4(1.0f, 0.0f, 0.0f, 0.0f));

        advectShader.run();

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
        default:
            return densVelTexture.textureID;
        }
    }
};

#endif // voxeltexture.hpp