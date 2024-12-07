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

    ComputeShader diffuseShader{};
    ComputeShader advectShader{};
    ComputeShader divShader{};

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
                    float val = (i >= 32 && i < 96 && j >= 32 && j < 96 && k >= 32 && k < 96) ? 1.0f : 0.0f;
                    data[index(i, j, k, 0)] = val;

                    float vel_val = (i >= 16 && i < 80 && j >= 32 && j < 96 && k >= 32 && k < 96) ? 5.0f : 0.0f;
                    data[index(i, j, k, 1)] = vel_val;
                }
            }
        }

    }

    void init_textures() {
        generate_data();

        diffuseShader.init("../data/shaders/compute/diffuse.glsl", dimXZ, dimY);
        advectShader.init("../data/shaders/compute/advect.glsl", dimXZ, dimY);
        divShader.init("../data/shaders/compute/div.glsl", dimXZ, dimY);

        densVelTexture.init(dimXZ, dimY, data);
        divergenceTexture.init(dimXZ, dimY);
    }

    void simulationStep(glm::vec3 targetSize, glm::vec3 targetOffest, float dt) {
        //std::cout << "Generating voxel texture..." << std::endl;

        diffuseShader.use();

        setUniform(diffuseShader.id(), "dt", dt);
        setUniform(diffuseShader.id(), "mu_density", 0.0001f);
        setUniform(diffuseShader.id(), "mu_velocity", 0.0001f);
        setUniform(diffuseShader.id(), "u_inputImg", 0);

        glActiveTexture(GL_TEXTURE0);
        densVelTexture.bind();

        glBindImageTexture(0, densVelTexture.textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        for (int i = 0; i < 15; i++) {
            diffuseShader.run();
        }

        advectShader.use();

        setUniform(advectShader.id(), "dt", 0.01f);
        setUniform(advectShader.id(), "u_inputImg", 0);
        setUniform(advectShader.id(), "u_velocity", 0);
        setUniform(advectShader.id(), "u_mask", glm::vec4(0.0f, 1.0f, 1.0f, 1.0f));

        advectShader.run();

        setUniform(advectShader.id(), "u_mask", glm::vec4(1.0f, 0.0f, 0.0f, 0.0f));

        advectShader.run();

        divShader.use();

        setUniform(divShader.id(), "u_inputImg", 0);

        glBindImageTexture(0, divergenceTexture.textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

        divShader.run();

        glBindImageTexture(0, 0, 0, GL_FALSE, 0, GL_READ_WRITE, GL_RGBA32F);
        glBindTexture(GL_TEXTURE_3D, 0);

        glUseProgram(0);
    }

    GLuint getTextureID() {
        return divergenceTexture.textureID;
    }
};

#endif // voxeltexture.hpp