#ifndef COMPUTE_SHADER_HPP
#define COMPUTE_SHADER_HPP

#include "shader.hpp"
#include "texture3D.hpp"

class ComputeShader {
public:
    ComputeShader() : programID(0) {}

    bool init(const std::string& filePath, int dimXZ, int dimY) {

        this->dimXZ = dimXZ;
        this->dimY = dimY;

        if (programID) destroy();

        programID = glCreateProgram();

        loadShader(programID, GL_COMPUTE_SHADER, filePath.c_str());

        if (programID != 0) {
            glLinkProgram(programID);
            return true;
        }

        return false;
    }

    void destroy() {
        if (programID) {
            glDeleteProgram(programID);
        }
    }

    void use() {
        if (programID) {
            glUseProgram(programID);
        }
    }

    void run(std::vector<Texture3D*> inputs, std::vector<std::string> input_names, Texture3D* output) {

        if (programID) {

            for (int i = 0; i < inputs.size(); i++) {
                glActiveTexture(GL_TEXTURE0 + i);
                glBindTexture(GL_TEXTURE_3D, inputs[i]->textureID);
                setUniform(id(), input_names[i].c_str(), i);
            }

            glBindImageTexture(0, output->textureID, 0, GL_TRUE, 0, GL_READ_WRITE, GL_RGBA32F);

            glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
            glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
        }
    }

    GLuint id() const {
        return programID;
    }

private:
    GLuint programID;
    int dimXZ;
    int dimY;
};

#endif // COMPUTE_SHADER_HPP